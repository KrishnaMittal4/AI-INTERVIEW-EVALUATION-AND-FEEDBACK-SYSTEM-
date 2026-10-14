from analyzer import compute_facial_nervousness, fuse_nervousness
from webcam_analyzer import WebcamNervousnessAnalyzer


def test_missing_face_is_not_scored_as_visual_nervousness():
    analyzer = WebcamNervousnessAnalyzer()
    analyzer._session_fps = analyzer.DEFAULT_FPS

    result = analyzer._compute_result(
        total_frames=6,
        detected_frames=0,
        blink_count=0,
        blink_frame_times=[],
        ear_values=[],
        mar_values=[],
        asymm_values=[],
        head_poses=[],
    )

    assert result["face_detected"] is False
    assert result["nervousness_score"] is None
    assert result["_reason"] == "no_face_detected"
    assert "No face detected" in result["warning"]


def test_partial_face_visibility_warns_without_increasing_gaze_nervousness():
    analyzer = WebcamNervousnessAnalyzer()
    analyzer._session_fps = analyzer.DEFAULT_FPS

    result = analyzer._compute_result(
        total_frames=6,
        detected_frames=3,
        blink_count=0,
        blink_frame_times=[],
        ear_values=[0.3, 0.3, 0.3],
        mar_values=[0.05, 0.05, 0.05],
        asymm_values=[0.01, 0.01, 0.01],
        head_poses=[(0.0, 0.0), (0.0, 0.0), (0.0, 0.0)],
    )

    assert result["face_detected"] is True
    assert result["face_detection_rate"] == 0.5
    assert result["gaze_aversion_rate"] == 0.0
    assert result["status"] == "partial"
    assert result["warning"]


def test_missing_face_leaves_overall_nervousness_to_voice_signal():
    facial = compute_facial_nervousness(face_detected=False)

    assert facial["available"] is False
    assert facial["facial_nervousness"] == 0.0
    assert fuse_nervousness(
        facial["facial_nervousness"],
        voice_nervousness=0.6,
        facial_available=facial["available"],
    ) == 0.6
