import pytest
from app.services import db_service
from app.schemas.ai import AIAssignmentProposal, AISectionItem
from app.services.export_service import generate_pdf_document, generate_docx_document
from app.services.ai_service import clean_and_parse_json, generate_heuristic_proposal
from app.core.config import settings


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_auth_unauthorized(client):
    res = client.get("/api/projects")
    assert res.status_code == 401


def test_project_crud_and_isolation(client, user_a_headers, user_b_headers):
    # 1. User Alpha creates project
    create_payload = {
        "title": "Data Structures Assignment 1",
        "subject": "Computer Science",
        "metadata": {
            "college": "MIT",
            "student_name": "Alice Smith",
            "roll_number": "CS-101",
            "instructions": "Implement Binary Search Trees and analyze time complexity."
        }
    }
    create_res = client.post("/api/projects", json=create_payload, headers=user_a_headers)
    assert create_res.status_code == 201
    proj_a = create_res.json()
    assert proj_a["title"] == "Data Structures Assignment 1"
    proj_id = proj_a["id"]

    # 2. User Alpha can fetch project
    get_res = client.get(f"/api/projects/{proj_id}", headers=user_a_headers)
    assert get_res.status_code == 200

    # 3. User Beta CANNOT fetch User Alpha's project (Isolation check)
    get_beta_res = client.get(f"/api/projects/{proj_id}", headers=user_b_headers)
    assert get_beta_res.status_code == 404

    # 4. User Beta CANNOT update User Alpha's project
    patch_beta_res = client.patch(f"/api/projects/{proj_id}", json={"title": "Hacked Title"}, headers=user_b_headers)
    assert patch_beta_res.status_code == 404

    # 5. User Alpha updates project
    patch_res = client.patch(f"/api/projects/{proj_id}", json={"title": "Updated BST Project"}, headers=user_a_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated BST Project"


@pytest.mark.parametrize("template", [
    "academic_standard",
    "lab_report",
    "technical_ieee",
    "modern_clean",
])
def test_create_assignment_supports_all_templates(client, user_a_headers, template):
    response = client.post(
        "/api/projects",
        headers=user_a_headers,
        json={
            "title": "Operating Systems Assignment",
            "subject": "Computer Science",
            "metadata": {
                "college": "Example College",
                "department": "Information Technology",
                "class_name": "Third Year",
                "student_name": "Student",
                "roll_number": "57",
                "teacher_name": "",
                "instructions": "",
                "formatting_template": template,
            },
        },
    )

    assert response.status_code == 201
    project = response.json()
    assert project["metadata"]["formatting_template"] == template
    assert project["metadata"]["teacher_name"] == ""
    assert project["metadata"]["instructions"] == ""


def test_create_assignment_rejects_malformed_auth_when_supabase_is_configured(
    client, monkeypatch
):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test")

    response = client.post(
        "/api/projects",
        headers={"Authorization": "Bearer test_token_not_a_jwt"},
        json={"title": "Assignment", "subject": "Subject"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Malformed bearer token"


def test_create_assignment_returns_safe_database_error(client, user_a_headers, monkeypatch):
    async def fail_create_project(*args, **kwargs):
        raise RuntimeError("database details must stay server-side")

    monkeypatch.setattr(db_service, "create_project", fail_create_project)

    response = client.post(
        "/api/projects",
        headers=user_a_headers,
        json={"title": "Assignment", "subject": "Subject"},
    )

    assert response.status_code == 502
    assert "database details" not in response.text


def test_ai_proposal_validation():
    sample_json = {
        "title": "Operating Systems Lab",
        "subject": "CS302",
        "executive_summary": "Process scheduling simulation and results.",
        "missing_information_flags": ["Gantt chart screenshot omitted"],
        "sections": [
            {
                "title": "Aim",
                "section_type": "aim",
                "content": "<p>To simulate Round Robin and Priority scheduling algorithms.</p>",
                "source_asset_indices": [0],
                "confidence_note": "Directly specified in instructions"
            },
            {
                "title": "Source Code",
                "section_type": "code",
                "content": "<pre><code>int main() { return 0; }</code></pre>",
                "source_asset_indices": [1]
            }
        ]
    }
    proposal = AIAssignmentProposal(**sample_json)
    assert proposal.title == "Operating Systems Lab"
    assert len(proposal.sections) == 2


def test_heuristic_generator_fallback():
    materials = [
        {
            "original_filename": "scheduler.c",
            "extracted_text": "#include <stdio.h>\nint main() { printf('CPU Scheduling'); return 0; }"
        }
    ]
    proposal = generate_heuristic_proposal(
        title="CPU Scheduling Assignment",
        subject="Operating Systems",
        project_metadata={"instructions": "Implement Round Robin scheduler"},
        materials=materials
    )
    assert proposal.title == "CPU Scheduling Assignment"
    assert len(proposal.sections) >= 5
    # Verify code section exists
    code_sec = next((s for s in proposal.sections if s.section_type == "code"), None)
    assert code_sec is not None
    assert "scheduler.c" in code_sec.title


def test_pdf_and_docx_generation():
    project_title = "Algorithm Complexity Report"
    subject = "Design & Analysis of Algorithms"
    metadata = {
        "college": "Stanford University",
        "department": "Computer Science",
        "student_name": "Bob Jones",
        "roll_number": "ST-404",
        "teacher_name": "Dr. Turing"
    }
    sections = [
        {
            "title": "1. Problem Statement",
            "content": "<p>Analyze the performance of QuickSort vs MergeSort across large datasets.</p>"
        },
        {
            "title": "2. Implementation",
            "content": "<pre><code>def quicksort(arr):\n    if len(arr) <= 1: return arr\n    pivot = arr[len(arr)//2]\n    return quicksort([x for x in arr if x < pivot]) + [pivot] + quicksort([x for x in arr if x > pivot])</code></pre>"
        },
        {
            "title": "3. Benchmark Results",
            "content": "<table><tr><th>Algorithm</th><th>10k Elements</th><th>100k Elements</th></tr><tr><td>QuickSort</td><td>0.02s</td><td>0.25s</td></tr><tr><td>MergeSort</td><td>0.03s</td><td>0.31s</td></tr></table>"
        }
    ]

    # Test PDF generation
    pdf_bytes = generate_pdf_document(project_title, subject, metadata, sections, include_cover_page=True)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

    # Test DOCX generation
    docx_bytes = generate_docx_document(project_title, subject, metadata, sections, include_cover_page=True)
    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 1000
    assert docx_bytes.startswith(b"PK")  # ZIP header for DOCX
