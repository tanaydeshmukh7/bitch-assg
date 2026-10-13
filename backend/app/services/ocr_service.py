import os
import shutil
import logging
from PIL import Image, ImageEnhance, ImageFilter
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# Check for tesseract binary in common Windows paths if not in PATH
_TESSERACT_CMD: Optional[str] = None
for candidate in [
    shutil.which("tesseract"),
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe")
]:
    if candidate and os.path.exists(candidate):
        _TESSERACT_CMD = candidate
        break

try:
    import pytesseract
    if _TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD
except ImportError:
    pytesseract = None


def is_ocr_available() -> bool:
    """Returns True if pytesseract and the tesseract binary are available."""
    if pytesseract is None:
        return False
    if _TESSERACT_CMD and os.path.exists(_TESSERACT_CMD):
        return True
    return bool(shutil.which("tesseract"))


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """Enhance image contrast and convert to grayscale for cleaner OCR results."""
    # Convert to grayscale
    gray = image.convert("L")
    # Increase contrast
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(1.8)
    return enhanced


def extract_text_from_image(image_path: str) -> Tuple[str, bool, Optional[str]]:
    """
    Extracts text from an image file using Tesseract OCR.
    Returns: (extracted_text, success, error_message)
    """
    if not is_ocr_available():
        msg = (
            "OCR (Tesseract) is not installed or not in system PATH. "
            "Image was stored safely. Install Tesseract OCR to enable automatic text extraction from images."
        )
        logger.warning(msg)
        return "", False, msg

    try:
        with Image.open(image_path) as img:
            processed = preprocess_image_for_ocr(img)
            text = pytesseract.image_to_string(processed)
            cleaned = text.strip()
            return cleaned, True, None
    except Exception as e:
        err = f"OCR processing failed: {str(e)}"
        logger.error(err)
        return "", False, err
