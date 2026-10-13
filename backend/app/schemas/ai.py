from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AISectionItem(BaseModel):
    title: str = Field(..., description="Title of the section, e.g., 'Introduction', 'Problem Statement'")
    section_type: str = Field(
        ...,
        description="Type identifier: title_page, aim, objectives, problem_statement, introduction, theory, requirements, algorithm, code, output, explanation, result, conclusion, references, viva_questions, custom"
    )
    content: str = Field(..., description="Well-formatted academic content in HTML/Markdown format")
    source_asset_indices: List[int] = Field(
        default_factory=list,
        description="Zero-based indices of the assets from which this section derived facts"
    )
    confidence_note: Optional[str] = Field(
        None,
        description="Optional clarification or note if source material was incomplete"
    )


class AIAssignmentProposal(BaseModel):
    title: str = Field(..., description="Refined or confirmed title of the assignment")
    subject: str = Field(..., description="Academic subject or course name")
    executive_summary: Optional[str] = Field(None, description="Brief overview of the generated assignment")
    sections: List[AISectionItem] = Field(..., description="Organized list of assignment sections")
    missing_information_flags: List[str] = Field(
        default_factory=list,
        description="List of detected gaps or missing requirements that student should be aware of"
    )


class OrganizeRequest(BaseModel):
    custom_instructions: Optional[str] = None
    target_template: Optional[str] = "academic_standard"
    selected_asset_ids: Optional[List[str]] = None
