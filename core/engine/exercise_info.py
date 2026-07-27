"""Exercise comprehension + movement previews — pure."""
from urllib.parse import quote_plus
from data import EXERCISE_INFO, _EXERCISE_IMAGES, _IMG_BASE

def get_exercise_info(name, muscles=""):
    """Decoupled comprehension layer. Returns plain-language descriptor, form
    cues, common mistake and a demo link. Curated entries fall back gracefully
    to a universal YouTube 'how to' search so every exercise has a demo."""
    demo = "https://www.youtube.com/results?search_query=" + quote_plus("how to " + name + " proper form")
    info = EXERCISE_INFO.get(name)
    if info:
        return {"desc": info.get("desc", ""), "cues": info.get("cues", []),
                "mistake": info.get("mistake", ""), "demo": info.get("demo", demo)}
    return {"desc": "",
            "cues": ["Move slowly and with control through a full, pain-free range.",
                     "Keep good posture and a braced core throughout."],
            "mistake": "Rushing the reps or using momentum instead of muscle.",
            "demo": demo}



def get_exercise_animation(name, color="#E8FF00"):
    """Real two-frame photographic preview (start <-> finish). Returns an
    empty string when we have no accurate image, so beginners never see a
    misleading visual -- the form cues + full video carry those cases."""
    frames = _EXERCISE_IMAGES.get(name)
    if not frames:
        return ""
    u0 = _IMG_BASE + frames[0]
    u1 = _IMG_BASE + frames[1] if len(frames) > 1 else u0
    return (
        "<div class='exa-prev'>"
        "<div class='exa-stage'>"
        f"<img class='exa-f exa-f0' src='{u0}' alt='{name} start position' "
        "onerror=\"var p=this.closest('.exa-prev'); if(p){p.style.display='none';}\">"
        f"<img class='exa-f exa-f1' src='{u1}' alt='{name} finish position'>"
        "</div>"
        "<div class='exa-cap'>Movement preview \u00b7 real demo photos</div>"
        "</div>"
    )

