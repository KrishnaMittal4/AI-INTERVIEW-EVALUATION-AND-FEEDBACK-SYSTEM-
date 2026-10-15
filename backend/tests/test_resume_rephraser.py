import pytest

import resume_rephraser_api as rephraser


def test_pdf_with_selectable_text_skips_ocr(monkeypatch):
    expected_text = (
        "A selectable-text resume with enough content to avoid OCR fallback because "
        "the native PDF text is complete and fully readable."
    )

    class FakePage:
        def extract_text(self):
            return expected_text

    class FakeReader:
        def __init__(self, _stream):
            self.pages = [FakePage()]

    def unexpected_ocr(_file_bytes):
        raise AssertionError("OCR should not run for a text-based PDF")

    monkeypatch.setattr(rephraser, "PYPDF_OK", True)
    monkeypatch.setattr(rephraser, "PdfReader", FakeReader)
    monkeypatch.setattr(rephraser, "_extract_text_from_pdf_ocr", unexpected_ocr)

    assert rephraser.extract_text_from_pdf(b"text-pdf") == expected_text


def test_scanned_pdf_uses_ocr_when_native_text_is_short(monkeypatch):
    expected_text = (
        "Experience: Built and maintained production services, improving API "
        "reliability and reducing response times for customers."
    )
    ocr_calls = []

    class FakePage:
        def extract_text(self):
            return "Scanned"

    class FakeReader:
        def __init__(self, _stream):
            self.pages = [FakePage()]

    def fake_ocr(file_bytes):
        ocr_calls.append(file_bytes)
        return expected_text

    monkeypatch.setattr(rephraser, "PYPDF_OK", True)
    monkeypatch.setattr(rephraser, "PdfReader", FakeReader)
    monkeypatch.setattr(rephraser, "_extract_text_from_pdf_ocr", fake_ocr)

    assert rephraser.extract_text_from_pdf(b"scanned-pdf") == expected_text
    assert ocr_calls == [b"scanned-pdf"]


def test_pdf_ocr_renders_pages_and_extracts_text(monkeypatch):
    calls = []

    class FakePixmap:
        def tobytes(self, image_format):
            assert image_format == "png"
            return b"rendered-page"

    class FakePage:
        def get_pixmap(self, *, matrix, alpha):
            assert matrix == (2, 2)
            assert alpha is False
            return FakePixmap()

    class FakeDocument:
        def __enter__(self):
            return [FakePage()]

        def __exit__(self, *_args):
            return False

    class FakePyMuPDF:
        @staticmethod
        def open(*, stream, filetype):
            assert stream == b"scanned-pdf"
            assert filetype == "pdf"
            return FakeDocument()

        @staticmethod
        def Matrix(*values):
            return values

    class FakeTesseract:
        @staticmethod
        def image_to_string(image):
            calls.append(image.getvalue())
            return "  OCR extracted resume text  "

    monkeypatch.setattr(rephraser, "PYMUPDF_OK", True)
    monkeypatch.setattr(rephraser, "PYTESSERACT_OK", True)
    monkeypatch.setattr(rephraser, "_pymupdf", FakePyMuPDF)
    monkeypatch.setattr(rephraser, "_pytesseract", FakeTesseract)

    assert rephraser._extract_text_from_pdf_ocr(b"scanned-pdf") == (
        "OCR extracted resume text"
    )
    assert calls == [b"rendered-page"]


def test_pdf_extraction_uses_native_text_then_ocr_for_image_only_pdf(monkeypatch):
    pdf_text = (
        "Experience: Built production services and APIs, reduced latency by 40 "
        "percent, improved reliability, and collaborated across engineering teams."
    )
    text_document = rephraser._pymupdf.open()
    text_document.new_page().insert_text((72, 72), pdf_text)
    text_pdf = text_document.tobytes()
    text_document.close()

    def unexpected_ocr(_file_bytes):
        raise AssertionError("OCR should not run for a text-based PDF")

    ocr_extractor = rephraser._extract_text_from_pdf_ocr
    monkeypatch.setattr(rephraser, "_extract_text_from_pdf_ocr", unexpected_ocr)
    assert pdf_text in rephraser.extract_text_from_pdf(text_pdf)

    source_document = rephraser._pymupdf.open()
    source_page = source_document.new_page()
    source_page.insert_text((72, 72), pdf_text, fontsize=16)
    page_image = source_page.get_pixmap(
        matrix=rephraser._pymupdf.Matrix(2, 2),
        alpha=False,
    ).tobytes("png")
    source_document.close()

    scanned_document = rephraser._pymupdf.open()
    scanned_page = scanned_document.new_page()
    scanned_page.insert_image(scanned_page.rect, stream=page_image)
    scanned_pdf = scanned_document.tobytes()
    scanned_document.close()

    ocr_inputs = []

    class FakeTesseract:
        @staticmethod
        def image_to_string(image):
            rendered_image = image.getvalue()
            assert rendered_image.startswith(b"\x89PNG")
            ocr_inputs.append(rendered_image)
            return pdf_text

    monkeypatch.setattr(rephraser, "PYMUPDF_OK", True)
    monkeypatch.setattr(rephraser, "PYTESSERACT_OK", True)
    monkeypatch.setattr(rephraser, "_pytesseract", FakeTesseract)
    monkeypatch.setattr(rephraser, "_extract_text_from_pdf_ocr", ocr_extractor)
    assert rephraser.extract_text_from_pdf(scanned_pdf) == pdf_text
    assert len(ocr_inputs) == 1


def test_rephrase_fails_explicitly_when_provider_returns_no_json(monkeypatch):
    monkeypatch.setattr(rephraser, "_call_groq_json", lambda *args, **kwargs: {})

    with pytest.raises(RuntimeError, match="valid rephrased resume"):
        rephraser.rephrase_resume({"summary": "Built an API"})


def test_rephrase_prompt_prohibits_invented_metrics_and_preserves_missing_fields(monkeypatch):
    captured = {}

    def fake_call(prompt, system):
        captured["prompt"] = prompt
        captured["system"] = system
        return {"summary": "Engineered an API"}

    monkeypatch.setattr(rephraser, "_call_groq_json", fake_call)
    parsed = {
        "summary": "Built an API",
        "experience": [{"company": "Example Co", "duration": "2022-2024"}],
    }

    result = rephraser.rephrase_resume(parsed, "Software Engineer")

    assert result["summary"] == "Engineered an API"
    assert result["experience"] == parsed["experience"]
    assert "Never add or estimate metrics" in captured["prompt"]
    assert "Never invent" in captured["system"]
