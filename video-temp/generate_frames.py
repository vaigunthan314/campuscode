"""
Complete Frame Generator for CampusCode Promotional Video
Duration: 32 seconds = 960 frames (frames 0 to 959 at 30 fps)
Resolution: 1920x1080
Design System:
- Background: #f7f7f4 (warm off-white)
- Text: #111111 (near-black)
- Purple accent: #7665ff (electric purple)
- Lime accent: #8bcf19 (lime green)
- Dark background (Scene 6): #090909
- Border: #deded8
"""

import os
import math
import multiprocessing
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
TOTAL_FRAMES = 960
FPS = 30

FRAMES_DIR = "/Users/vaigunthansl/Desktop/Rebuild /video-temp/frames"

# Fonts cache
FONTS = {}

def get_font(size, bold=False, mono=False):
    key = (size, bold, mono)
    if key in FONTS:
        return FONTS[key]
    
    candidates = []
    if mono:
        candidates = [
            "/System/Library/Fonts/Menlo.ttc",
            "/System/Library/Fonts/Monaco.ttf",
            "/System/Library/Fonts/Courier.ttc",
        ]
    else:
        candidates = [
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        ]
        
    font = None
    for path in candidates:
        if os.path.exists(path):
            try:
                idx = 1 if bold and "HelveticaNeue" in path else 0
                font = ImageFont.truetype(path, size, index=idx)
                break
            except Exception:
                try:
                    font = ImageFont.truetype(path, size)
                    break
                except Exception:
                    continue
    if font is None:
        font = ImageFont.load_default()
    FONTS[key] = font
    return font

def ease_in_out(t):
    """Hermite smoothstep easing."""
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)

def ease_out_cubic(t):
    t = max(0.0, min(1.0, t))
    return 1.0 - (1.0 - t) ** 3

def draw_skewed_bar(draw, x, y, width, height, skew_deg, fill):
    """Draw a rectangle skewed horizontally by skew_deg."""
    rad = math.radians(skew_deg)
    dx = height * math.tan(rad)
    pts = [
        (x, y),
        (x + width, y),
        (x + width + dx, y + height),
        (x + dx, y + height)
    ]
    draw.polygon(pts, fill=fill)

def draw_3bar_logo(draw, center_x, center_y, scale=1.0):
    """Draw the 3 skewed bars of the CampusCode logo."""
    # Base dimensions: 3 bars
    w = 12 * scale
    h = 64 * scale
    gap = 10 * scale
    skew = -17.0
    
    total_w = 3 * w + 2 * gap
    start_x = center_x - total_w / 2.0
    start_y = center_y - h / 2.0
    
    # Bar 1: White or dark depending on context
    draw_skewed_bar(draw, start_x, start_y, w, h, skew, "#ffffff")
    # Bar 2: Electric purple
    draw_skewed_bar(draw, start_x + w + gap, start_y, w, h, skew, "#7566ff")
    # Bar 3: Lime green
    draw_skewed_bar(draw, start_x + (w + gap) * 2, start_y, w, h, skew, "#8bcf19")

def draw_rounded_card(draw, box, rx=16, fill="#ffffff", outline="#deded8", width=1):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0, y0, x1, y1], radius=rx, fill=fill, outline=outline, width=width)

# Pre-render base background with technical grid and HUD markers
def make_base_background():
    img = Image.new("RGB", (WIDTH, HEIGHT), "#f7f7f4")
    draw = ImageDraw.Draw(img)
    
    # 42px subtle grid
    grid_col = (238, 238, 234)
    for x in range(0, WIDTH, 42):
        draw.line([(x, 0), (x, HEIGHT)], fill=grid_col, width=1)
    for y in range(0, HEIGHT, 42):
        draw.line([(0, y), (WIDTH, y)], fill=grid_col, width=1)
        
    # Technical Corner Brackets
    b_col = (180, 180, 175)
    b_len = 24
    
    # Top-Left (80, 80)
    draw.line([(80, 80), (80 + b_len, 80)], fill=b_col, width=2)
    draw.line([(80, 80), (80, 80 + b_len)], fill=b_col, width=2)
    
    # Bottom-Right (1840, 1000)
    draw.line([(1840 - b_len, 1000), (1840, 1000)], fill=b_col, width=2)
    draw.line([(1840, 1000 - b_len), (1840, 1000)], fill=b_col, width=2)
    
    # Top-Right Crosshair (1840, 80)
    draw.line([(1834, 80), (1846, 80)], fill=b_col, width=1)
    draw.line([(1840, 74), (1840, 86)], fill=b_col, width=1)
    
    # Bottom-Left Crosshair (80, 1000)
    draw.line([(74, 1000), (86, 1000)], fill=b_col, width=1)
    draw.line([(80, 994), (80, 1006)], fill=b_col, width=1)
    
    # Top technical HUD label
    f_hud = get_font(13, mono=True)
    draw.text((120, 74), "CAMPUSCODE // ARENA ENGINE", fill="#999990", font=f_hud)
    draw.text((1650, 74), "SYSTEM: ACTIVE", fill="#7665ff", font=f_hud)
    draw.ellipse([(1634, 78), (1642, 86)], fill="#8bcf19")
    
    return img

BASE_BG = make_base_background()

# ----------------- SCENE RENDERERS -----------------

def render_scene_1(frame_idx):
    """
    Scene 1: BUILD. COMPETE. SHIP. (frames 0-119, 0-4s)
    Words reveal word by word with smooth fade & slide up.
    Purple underline animates under all 3 words.
    """
    img = BASE_BG.copy()
    draw = ImageDraw.Draw(img)
    
    f_huge = get_font(116, bold=True)
    f_mono = get_font(18, mono=True)
    f_tag = get_font(15, mono=True)
    
    # Words configuration: (text, start_frame, end_frame, final_y, tag)
    words = [
        ("BUILD.", 15, 35, 300, "[ 01 / FORMULATE ]"),
        ("COMPETE.", 40, 60, 440, "[ 02 / SQUAD UP ]"),
        ("SHIP.", 65, 85, 580, "[ 03 / PRODUCTION ]"),
    ]
    
    base_x = 380
    
    for text, s_f, e_f, target_y, tag in words:
        if frame_idx >= s_f:
            progress = ease_out_cubic((frame_idx - s_f) / float(e_f - s_f))
            alpha = progress
            curr_y = int(target_y + (1.0 - progress) * 28)
            
            # Text color (fade from off-white to near black)
            r = int(247 + (17 - 247) * alpha)
            g = int(247 + (17 - 247) * alpha)
            b = int(244 + (17 - 244) * alpha)
            col = (r, g, b)
            
            draw.text((base_x, curr_y), text, fill=col, font=f_huge)
            
            # Accompanying technical tag
            if alpha > 0.4:
                tag_alpha = (alpha - 0.4) / 0.6
                t_r = int(247 + (118 - 247) * tag_alpha)
                t_g = int(247 + (101 - 247) * tag_alpha)
                t_b = int(244 + (255 - 244) * tag_alpha)
                draw.text((base_x + 680, curr_y + 45), tag, fill=(t_r, t_g, t_b), font=f_tag)

    # Purple underline animation (frames 85-110)
    if frame_idx >= 85:
        u_prog = ease_in_out((frame_idx - 85) / 25.0)
        u_width = int(u_prog * 860)
        u_y = 730
        draw.line([(base_x, u_y), (base_x + u_width, u_y)], fill="#7665ff", width=5)
        
        # Leading lime head dot on underline
        if u_width > 10 and u_prog < 0.98:
            draw.ellipse([(base_x + u_width - 4, u_y - 4), (base_x + u_width + 4, u_y + 4)], fill="#8bcf19")

    # Corner bracket highlight pulse
    if frame_idx >= 90:
        pulse = 0.5 + 0.5 * math.sin((frame_idx - 90) * 0.25)
        p_col = (int(118 * pulse + 180 * (1 - pulse)), int(101 * pulse + 180 * (1 - pulse)), int(255 * pulse + 175 * (1 - pulse)))
        draw.line([(80, 80), (80 + 36, 80)], fill=p_col, width=3)
        draw.line([(80, 80), (80, 80 + 36)], fill=p_col, width=3)

    return img


def render_scene_2(frame_idx):
    """
    Scene 2: ONE ARENA (frames 120-269, 4-9s)
    UI mockups: Student profile card (left), Team panel (center), Arena telemetry (right).
    """
    img = BASE_BG.copy()
    draw = ImageDraw.Draw(img)
    
    local_f = frame_idx - 120
    
    # Section Header
    f_mono = get_font(18, mono=True)
    f_head = get_font(44, bold=True)
    f_sub = get_font(19, mono=True)
    
    draw.text((140, 130), "01 — ONE ARENA", fill="#7665ff", font=f_mono)
    draw.text((140, 168), "THE DIGITAL HOME FOR STUDENT INNOVATION.", fill="#111111", font=f_head)
    draw.text((140, 226), "A unified arena where students, teams, and organizers build the future together.", fill="#777777", font=f_sub)
    
    # 3 Cards configuration: (x, y, w, h, start_frame)
    # Card 1: Student Profile (left: X=140, W=480, H=630)
    c1_prog = ease_out_cubic((local_f - 5) / 25.0)
    if c1_prog > 0:
        c1_y = int(280 + (1.0 - c1_prog) * 40)
        draw_rounded_card(draw, [140, c1_y, 140 + 480, c1_y + 630], rx=16, fill="#ffffff", outline="#deded8", width=1)
        
        # CC Avatar badge
        draw.rounded_rectangle([170, c1_y + 30, 230, c1_y + 90], radius=12, fill="#090909")
        f_avatar = get_font(22, bold=True)
        draw.text((184, c1_y + 46), "CC", fill="#ffffff", font=f_avatar)
        draw.ellipse([218, c1_y + 36, 226, c1_y + 44], fill="#8bcf19")
        
        # Name and Title
        f_name = get_font(24, bold=True)
        f_card_sub = get_font(16, mono=True)
        draw.text((250, c1_y + 34), "ALEX CHEN", fill="#111111", font=f_name)
        draw.text((250, c1_y + 66), "AI & SYSTEMS BUILDER", fill="#7665ff", font=f_card_sub)
        
        # Status Pill
        draw.rounded_rectangle([170, c1_y + 115, 330, c1_y + 145], radius=15, fill="#f0fae6", outline="#8bcf19", width=1)
        draw.ellipse([182, c1_y + 126, 190, c1_y + 134], fill="#8bcf19")
        f_pill = get_font(13, mono=True)
        draw.text((198, c1_y + 123), "ACTIVE IN ARENA", fill="#3b7006", font=f_pill)
        
        # Divider
        draw.line([(170, c1_y + 165), (590, c1_y + 165)], fill="#eeeeee", width=1)
        
        # Metric Chips
        draw.text((170, c1_y + 185), "BUILDER CREDENTIALS", fill="#999999", font=f_card_sub)
        metrics = [("HACKATHONS", "04"), ("WINS", "02"), ("GLOBAL RANK", "TOP 3%")]
        for i, (m_lbl, m_val) in enumerate(metrics):
            chip_y = c1_y + 220 + i * 54
            draw.rounded_rectangle([170, chip_y, 590, chip_y + 44], radius=8, fill="#f8f8f6", outline="#deded8", width=1)
            draw.text((188, chip_y + 13), m_lbl, fill="#666666", font=f_pill)
            draw.text((510, chip_y + 11), m_val, fill="#111111", font=get_font(16, bold=True))
            
        # Skill bars
        draw.text((170, c1_y + 400), "VERIFIED SKILLS", fill="#999999", font=f_card_sub)
        skills = [("TypeScript / React", 0.92), ("PyTorch / LLMs", 0.86), ("Rust / WebAssembly", 0.74)]
        for i, (s_name, s_pct) in enumerate(skills):
            bar_y = c1_y + 435 + i * 48
            draw.text((170, bar_y), s_name, fill="#333333", font=f_pill)
            draw.rounded_rectangle([170, bar_y + 20, 590, bar_y + 28], radius=4, fill="#eeeeee")
            anim_pct = min(s_pct, s_pct * max(0.0, (local_f - 25) / 30.0))
            if anim_pct > 0:
                draw.rounded_rectangle([170, bar_y + 20, 170 + int(420 * anim_pct), bar_y + 28], radius=4, fill="#7665ff")

    # Card 2: Team Panel (center: X=660, W=580, H=630)
    c2_prog = ease_out_cubic((local_f - 20) / 25.0)
    if c2_prog > 0:
        c2_y = int(280 + (1.0 - c2_prog) * 40)
        draw_rounded_card(draw, [660, c2_y, 660 + 580, c2_y + 630], rx=16, fill="#ffffff", outline="#deded8", width=1)
        
        # Team Header
        f_name = get_font(24, bold=True)
        f_card_sub = get_font(16, mono=True)
        f_pill = get_font(13, mono=True)
        draw.text((690, c2_y + 32), "TEAM: SYNAPSE LABS", fill="#111111", font=f_name)
        draw.text((690, c2_y + 64), "TRACK: AI INNOVATION 2026", fill="#7665ff", font=f_card_sub)
        
        # 4/4 Members Pill
        draw.rounded_rectangle([1100, c2_y + 32, 1205, c2_y + 64], radius=16, fill="#f2f0ff", outline="#7665ff", width=1)
        draw.text((1115, c2_y + 40), "4/4 SQUAD", fill="#7665ff", font=f_pill)
        
        draw.line([(690, c2_y + 105), (1210, c2_y + 105)], fill="#eeeeee", width=1)
        
        # Squad Roster
        draw.text((690, c2_y + 125), "SQUAD MEMBERS", fill="#999999", font=f_card_sub)
        roster = [
            ("Alex Chen", "Tech Lead & AI", "READY", "#8bcf19"),
            ("Priya Sharma", "ML Engineer", "READY", "#8bcf19"),
            ("Marcus Vance", "Frontend Architecture", "ACTIVE", "#7665ff"),
            ("Elena Rostova", "Product & Design", "READY", "#8bcf19"),
        ]
        for i, (m_name, m_role, m_st, m_col) in enumerate(roster):
            row_y = c2_y + 160 + i * 62
            draw.rounded_rectangle([690, row_y, 1210, row_y + 52], radius=8, fill="#fbfbfa", outline="#eeeeee", width=1)
            # Avatar circle
            draw.ellipse([705, row_y + 12, 733, row_y + 40], fill="#e8e8e4")
            draw.text((713, row_y + 16), m_name[0], fill="#111111", font=get_font(14, bold=True))
            
            draw.text((748, row_y + 11), m_name, fill="#111111", font=get_font(16, bold=True))
            draw.text((748, row_y + 30), m_role, fill="#777777", font=f_pill)
            
            # Status dot
            draw.ellipse([1140, row_y + 22, 1148, row_y + 30], fill=m_col)
            draw.text((1156, row_y + 18), m_st, fill=m_col, font=f_pill)
            
        # Sprint milestone progress
        draw.text((690, c2_y + 430), "ARENA SPRINT 2 / 3", fill="#999999", font=f_card_sub)
        draw.rounded_rectangle([690, c2_y + 460, 1210, c2_y + 476], radius=8, fill="#eeeeee")
        sprint_anim = min(0.78, 0.78 * max(0.0, (local_f - 40) / 35.0))
        if sprint_anim > 0:
            draw.rounded_rectangle([690, c2_y + 460, 690 + int(520 * sprint_anim), c2_y + 476], radius=8, fill="#7665ff")
            
        draw.text((690, c2_y + 490), "REPO: campuscode/synapse-core", fill="#555555", font=f_pill)
        
        # Live sync indicator
        pulse = 0.5 + 0.5 * math.sin(local_f * 0.3)
        p_col = (int(139 * pulse), int(207 * pulse), int(25 * pulse))
        draw.ellipse([690, c2_y + 550, 700, c2_y + 560], fill=p_col)
        draw.text((712, c2_y + 547), "CONTINUOUS INTEGRATION • SYNCED", fill="#3b7006", font=f_pill)

    # Card 3: Arena Dashboard (right: X=1280, W=500, H=630)
    c3_prog = ease_out_cubic((local_f - 35) / 25.0)
    if c3_prog > 0:
        c3_y = int(280 + (1.0 - c3_prog) * 40)
        draw_rounded_card(draw, [1280, c3_y, 1280 + 500, c3_y + 630], rx=16, fill="#ffffff", outline="#deded8", width=1)
        
        f_name = get_font(24, bold=True)
        f_card_sub = get_font(16, mono=True)
        f_pill = get_font(13, mono=True)
        
        draw.text((1310, c3_y + 32), "ARENA METRICS", fill="#111111", font=f_name)
        draw.text((1310, c3_y + 64), "LIVE ECOSYSTEM TELEMETRY", fill="#7665ff", font=f_card_sub)
        
        draw.line([(1310, c3_y + 105), (1750, c3_y + 105)], fill="#eeeeee", width=1)
        
        # Big Stats
        kpis = [
            ("2,480", "ACTIVE BUILDERS", "#111111"),
            ("142", "PROJECTS SUBMITTED", "#7665ff"),
            ("$50,000", "PRIZE POOL AWARDED", "#8bcf19"),
        ]
        for i, (val, lbl, color) in enumerate(kpis):
            box_y = c3_y + 125 + i * 95
            draw.rounded_rectangle([1310, box_y, 1750, box_y + 80], radius=10, fill="#fbfbfa", outline="#deded8", width=1)
            draw.text((1330, box_y + 14), val, fill=color, font=get_font(32, bold=True))
            draw.text((1330, box_y + 52), lbl, fill="#777777", font=f_pill)

        # Live Arena Feed
        draw.text((1310, c3_y + 430), "LIVE ARENA FEED", fill="#999999", font=f_card_sub)
        feed = [
            "Team NeuralFlow pushed demo commit (4m ago)",
            "Team ByteCraft passed compliance check (11m ago)",
            "Mentor review completed for Track 01 (18m ago)",
        ]
        for i, item in enumerate(feed):
            item_y = c3_y + 465 + i * 42
            draw.ellipse([1315, item_y + 4, 1321, item_y + 10], fill="#7665ff")
            draw.text((1332, item_y), item, fill="#444444", font=f_pill)

    return img


def render_scene_3(frame_idx):
    """
    Scene 3: AI COPILOT (frames 270-449, 9-15s)
    2x2 grid of AI feature cards:
    IdeaCheck, HackMate, RuleBot, AI Scoring.
    """
    img = BASE_BG.copy()
    draw = ImageDraw.Draw(img)
    
    local_f = frame_idx - 270
    
    f_mono = get_font(18, mono=True)
    f_head = get_font(44, bold=True)
    f_sub = get_font(19, mono=True)
    f_card_title = get_font(26, bold=True)
    f_body = get_font(17, mono=False)
    f_tag = get_font(14, mono=True)
    
    draw.text((160, 130), "02 — AI COPILOT", fill="#7665ff", font=f_mono)
    draw.text((160, 168), "AN AI COPILOT IN EVERY CORNER.", fill="#111111", font=f_head)
    draw.text((160, 226), "Autonomous agents assisting student builders through every phase of the competition.", fill="#777777", font=f_sub)
    
    cards = [
        # (title, subtitle, body, badge_txt, badge_col, x, y, w, h, delay)
        (
            "IdeaCheck AI",
            "PRE-FLIGHT VALIDATION",
            "Evaluates project originality, technical feasibility, and architectural depth against 10,000+ past hackathon submissions.",
            "NOVELTY SCORE: 94% • HIGH POTENTIAL",
            "#8bcf19",
            160, 280, 770, 300, 10
        ),
        (
            "HackMate AI",
            "AUTONOMOUS TEAM MATCHING",
            "Matches complementary skill sets, time zones, and ambition levels to assemble championship-ready squads automatically.",
            "MATCH ACCURACY: 98.4% COMPATIBILITY",
            "#7665ff",
            990, 280, 770, 300, 35
        ),
        (
            "RuleBot 24/7",
            "INSTANT COMPLIANCE ORACLE",
            "Real-time guidance on API allowances, submission deadlines, licensing, and sponsor prize category requirements.",
            "RESPONSE TIME: < 350ms • ZERO HALLUCINATION",
            "#7665ff",
            160, 610, 770, 300, 60
        ),
        (
            "AI Scoring Matrix",
            "MULTI-DIMENSIONAL BENCHMARK",
            "Transparent and objective evaluation of code execution, UX polish, technical complexity, and real-world viability.",
            "OBJECTIVE EVALUATION • BENCHMARK 96.8/100",
            "#8bcf19",
            990, 610, 770, 300, 85
        )
    ]
    
    for title, subtitle, body, badge_txt, badge_col, cx, cy, cw, ch, delay in cards:
        prog = ease_out_cubic((local_f - delay) / 25.0)
        if prog <= 0:
            continue
            
        cur_y = int(cy + (1.0 - prog) * 35)
        # Card background
        draw_rounded_card(draw, [cx, cur_y, cx + cw, cur_y + ch], rx=16, fill="#ffffff", outline="#deded8", width=1)
        
        # Icon box
        draw.rounded_rectangle([cx + 30, cur_y + 30, cx + 80, cur_y + 80], radius=10, fill="#f2f0ff")
        
        # Draw distinctive geometric icon per card
        if "IdeaCheck" in title:
            # Checkmark
            draw.line([(cx + 42, cur_y + 55), (cx + 52, cur_y + 65)], fill="#7665ff", width=4)
            draw.line([(cx + 52, cur_y + 65), (cx + 68, cur_y + 44)], fill="#7665ff", width=4)
        elif "HackMate" in title:
            # Squad nodes
            draw.ellipse([cx + 44, cur_y + 42, cx + 54, cur_y + 52], fill="#7665ff")
            draw.ellipse([cx + 60, cur_y + 56, cx + 70, cur_y + 66], fill="#7665ff")
            draw.line([(cx + 49, cur_y + 47), (cx + 65, cur_y + 61)], fill="#7665ff", width=2)
        elif "RuleBot" in title:
            # Document icon
            draw.rounded_rectangle([cx + 46, cur_y + 42, cx + 64, cur_y + 68], radius=3, outline="#7665ff", width=2)
            draw.line([(cx + 50, cur_y + 50), (cx + 60, cur_y + 50)], fill="#7665ff", width=2)
            draw.line([(cx + 50, cur_y + 56), (cx + 60, cur_y + 56)], fill="#7665ff", width=2)
            draw.line([(cx + 50, cur_y + 62), (cx + 58, cur_y + 62)], fill="#7665ff", width=2)
        else:
            # Gauge / radar
            draw.arc([cx + 42, cur_y + 42, cx + 68, cur_y + 68], start=180, end=360, fill="#8bcf19", width=4)
            draw.line([(cx + 55, cur_y + 55), (cx + 63, cur_y + 47)], fill="#8bcf19", width=3)
            
        # Title and Subtitle
        draw.text((cx + 98, cur_y + 32), title, fill="#111111", font=f_card_title)
        draw.text((cx + 98, cur_y + 65), subtitle, fill="#7665ff", font=f_tag)
        
        # Body text (wrapped)
        draw.text((cx + 32, cur_y + 110), body, fill="#444444", font=f_body)
        
        # Bottom Badge
        badge_fill = "#f0fae6" if badge_col == "#8bcf19" else "#f2f0ff"
        text_col = "#3b7006" if badge_col == "#8bcf19" else "#7665ff"
        draw.rounded_rectangle([cx + 30, cur_y + ch - 54, cx + cw - 30, cur_y + ch - 22], radius=8, fill=badge_fill, outline=badge_col, width=1)
        draw.ellipse([cx + 44, cur_y + ch - 41, cx + 52, cur_y + ch - 33], fill=badge_col)
        draw.text((cx + 62, cur_y + ch - 44), badge_txt, fill=text_col, font=f_tag)

    return img


def render_scene_4(frame_idx):
    """
    Scene 4: PROBLEM -> BUILD -> SHIP (frames 450-599, 15-20s)
    Three connected stage markers arranged horizontally with drawing lines.
    """
    img = BASE_BG.copy()
    draw = ImageDraw.Draw(img)
    
    local_f = frame_idx - 450
    
    f_mono = get_font(18, mono=True)
    f_head = get_font(44, bold=True)
    f_sub = get_font(19, mono=True)
    f_num = get_font(32, bold=True)
    f_stage_title = get_font(28, bold=True)
    f_stage_sub = get_font(16, mono=True)
    
    draw.text((160, 130), "03 — THE JOURNEY", fill="#7665ff", font=f_mono)
    draw.text((160, 168), "FROM ZERO TO PRODUCTION IN 48 HOURS.", fill="#111111", font=f_head)
    draw.text((160, 226), "A disciplined three-stage progression taking builders from raw concept to live deployment.", fill="#777777", font=f_sub)
    
    # 3 Stage marker positions
    stages = [
        (400, 520, "01", "PROBLEM", "Challenge Discovery", "Validate problem & map tech specs"),
        (960, 520, "02", "BUILD", "Collaborative Sprint", "Rapid prototyping with AI Copilot"),
        (1520, 520, "03", "SHIP", "Production Deploy", "Submit live demo & claim arena prizes"),
    ]
    
    rad = 68
    
    # Timeline thresholds:
    # Stage 1 fills: local_f 15..45
    # Line 1-2 draws: local_f 45..75
    # Stage 2 fills: local_f 75..105
    # Line 2-3 draws: local_f 105..135
    # Stage 3 fills: local_f 135..165
    
    # Connecting line 1 -> 2
    l1_start_x = 400 + rad
    l1_end_x = 960 - rad
    l1_prog = ease_in_out((local_f - 45) / 30.0)
    if l1_prog > 0:
        cur_x = l1_start_x + int((l1_end_x - l1_start_x) * l1_prog)
        draw.line([(l1_start_x, 520), (cur_x, 520)], fill="#7665ff", width=4)
        if l1_prog < 0.98:
            draw.ellipse([(cur_x - 5, 515), (cur_x + 5, 525)], fill="#8bcf19")
    else:
        # Base dotted line
        for dot_x in range(l1_start_x, l1_end_x, 18):
            draw.ellipse([(dot_x, 518), (dot_x + 4, 522)], fill="#deded8")
            
    # Connecting line 2 -> 3
    l2_start_x = 960 + rad
    l2_end_x = 1520 - rad
    l2_prog = ease_in_out((local_f - 105) / 30.0)
    if l2_prog > 0:
        cur_x = l2_start_x + int((l2_end_x - l2_start_x) * l2_prog)
        draw.line([(l2_start_x, 520), (cur_x, 520)], fill="#7665ff", width=4)
        if l2_prog < 0.98:
            draw.ellipse([(cur_x - 5, 515), (cur_x + 5, 525)], fill="#8bcf19")
    else:
        for dot_x in range(l2_start_x, l2_end_x, 18):
            draw.ellipse([(dot_x, 518), (dot_x + 4, 522)], fill="#deded8")

    # Render Stages
    stage_timing = [(15, 45), (75, 105), (135, 165)]
    for i, (cx, cy, num, title, subtitle, desc) in enumerate(stages):
        s_s, s_e = stage_timing[i]
        fill_prog = ease_in_out((local_f - s_s) / float(s_e - s_s))
        
        # Outer ring
        draw.ellipse([(cx - rad, cy - rad), (cx + rad, cy + rad)], outline="#deded8", width=3)
        
        if fill_prog > 0:
            # Active circle expansion
            cur_r = int(rad * fill_prog)
            draw.ellipse([(cx - cur_r, cy - cur_r), (cx + cur_r, cy + cur_r)], fill="#7665ff")
            
            # Text inside circle
            num_col = "#ffffff"
            draw.text((cx - 18, cy - 20), num, fill=num_col, font=f_num)
            
            # Completed lime dot
            if fill_prog >= 0.9:
                draw.ellipse([(cx + rad - 12, cy - rad + 4), (cx + rad + 8, cy - rad + 24)], fill="#8bcf19", outline="#ffffff", width=2)
        else:
            # Idle circle
            draw.ellipse([(cx - rad, cy - rad), (cx + rad, cy + rad)], fill="#ffffff", outline="#deded8", width=2)
            draw.text((cx - 18, cy - 20), num, fill="#999999", font=f_num)
            
        # Text below each stage
        draw.text((cx - 90, cy + rad + 28), title, fill="#111111", font=f_stage_title)
        draw.text((cx - 90, cy + rad + 68), subtitle, fill="#7665ff", font=f_stage_sub)
        draw.text((cx - 90, cy + rad + 96), desc, fill="#666666", font=f_stage_sub)
        
        # Status chip
        if fill_prog >= 0.95:
            draw.rounded_rectangle([cx - 90, cy + rad + 140, cx + 90, cy + rad + 172], radius=16, fill="#f0fae6", outline="#8bcf19", width=1)
            draw.text((cx - 65, cy + rad + 148), "STAGE COMPLETE", fill="#3b7006", font=get_font(13, mono=True))
        else:
            draw.rounded_rectangle([cx - 90, cy + rad + 140, cx + 90, cy + rad + 172], radius=16, fill="#fbfbfa", outline="#deded8", width=1)
            draw.text((cx - 55, cy + rad + 148), "PENDING SPRINT", fill="#999999", font=get_font(13, mono=True))

    return img


def render_scene_5(frame_idx):
    """
    Scene 5: VERIFIED IN ONE SCAN (frames 600-749, 20-25s)
    Hero Student Identity Card slides in, scan line sweeps, verification confirmed.
    """
    img = BASE_BG.copy()
    draw = ImageDraw.Draw(img)
    
    local_f = frame_idx - 600
    
    f_mono = get_font(18, mono=True)
    f_head = get_font(44, bold=True)
    f_sub = get_font(19, mono=True)
    
    draw.text((160, 130), "04 — IDENTITY", fill="#7665ff", font=f_mono)
    draw.text((160, 168), "VERIFIED IN ONE SCAN.", fill="#111111", font=f_head)
    draw.text((160, 226), "Cryptographic student credentials enabling instant arena access and team verification.", fill="#777777", font=f_sub)
    
    # Hero Card Dimensions
    card_w = 540
    card_h = 700
    
    # Slide in from right (frames 605-640)
    slide_prog = ease_out_cubic(min(1.0, max(0.0, (local_f - 5) / 35.0)))
    target_cx = 960
    start_cx = 1600
    cur_cx = int(start_cx + (target_cx - start_cx) * slide_prog)
    cur_cy = 640
    
    x0 = cur_cx - card_w // 2
    y0 = cur_cy - card_h // 2
    x1 = x0 + card_w
    y1 = y0 + card_h
    
    # Subtle drop shadow
    draw.rounded_rectangle([x0 + 12, y0 + 12, x1 + 12, y1 + 12], radius=24, fill="#e8e8e2")
    # Card base
    draw.rounded_rectangle([x0, y0, x1, y1], radius=24, fill="#ffffff", outline="#deded8", width=2)
    
    # Top Card Bar
    draw.rounded_rectangle([x0, y0, x1, y0 + 80], radius=24, fill="#090909")
    draw.rectangle([x0, y0 + 40, x1, y0 + 80], fill="#090909") # flatten bottom curve
    
    # CampusCode wordmark and logo on card
    draw_3bar_logo(draw, x0 + 50, y0 + 40, scale=0.6)
    draw.text((x0 + 90, y0 + 26), "CAMPUSCODE", fill="#ffffff", font=get_font(22, bold=True))
    draw.text((x1 - 180, y0 + 30), "STUDENT PASSPORT", fill="#8bcf19", font=get_font(13, mono=True))
    
    # Card body content
    f_card_label = get_font(13, mono=True)
    f_card_val = get_font(22, bold=True)
    
    # Avatar frame
    draw.rounded_rectangle([x0 + 40, y0 + 110, x0 + 150, y0 + 220], radius=14, fill="#f2f2ee", outline="#deded8", width=1)
    # Silhouette
    draw.ellipse([x0 + 75, y0 + 130, x0 + 115, y0 + 170], fill="#888880")
    draw.ellipse([x0 + 55, y0 + 180, x0 + 135, y0 + 240], fill="#888880")
    
    # Student Details
    draw.text((x0 + 175, y0 + 115), "BUILDER NAME", fill="#999990", font=f_card_label)
    draw.text((x0 + 175, y0 + 135), "ALEXANDER CHEN", fill="#111111", font=f_card_val)
    
    draw.text((x0 + 175, y0 + 175), "UNIVERSITY & TRACK", fill="#999990", font=f_card_label)
    draw.text((x0 + 175, y0 + 195), "STANFORD // AI TRACK '26", fill="#7665ff", font=get_font(17, bold=True))
    
    # Divider
    draw.line([(x0 + 40, y0 + 245), (x1 - 40, y0 + 245)], fill="#eeeeee", width=1)
    
    # Identification details
    details = [
        ("ARENA ID", "CC-STANFORD-2026-8842"),
        ("SECURITY HASH", "0x7F2A...9C14 (ED25519)"),
        ("STATUS", "AUTHENTICATED & LEVEL 3 CLEARED"),
    ]
    for i, (lbl, val) in enumerate(details):
        r_y = y0 + 265 + i * 50
        draw.text((x0 + 40, r_y), lbl, fill="#999990", font=f_card_label)
        draw.text((x0 + 40, r_y + 18), val, fill="#222222", font=get_font(15, mono=True))
        
    # QR Code Grid Simulation (centered bottom)
    qr_cx = cur_cx
    qr_cy = y0 + 490
    qr_sz = 140
    qr_x0 = qr_cx - qr_sz // 2
    qr_y0 = qr_cy - qr_sz // 2
    
    # QR Background
    draw.rectangle([qr_x0 - 8, qr_y0 - 8, qr_x0 + qr_sz + 8, qr_y0 + qr_sz + 8], fill="#fbfbfa", outline="#deded8", width=1)
    
    # Draw precise geometric pattern resembling QR matrix
    grid_cells = 14
    cell_w = qr_sz / grid_cells
    
    # Seeded pseudo-random pattern for clean QR appearance
    for r in range(grid_cells):
        for c in range(grid_cells):
            # 3 Corner Finder Patterns
            is_finder = (r < 4 and c < 4) or (r < 4 and c >= grid_cells - 4) or (r >= grid_cells - 4 and c < 4)
            if is_finder:
                # Finder border
                if r == 0 or r == 3 or c == 0 or c == 3 or r == grid_cells - 1 or r == grid_cells - 4 or c == grid_cells - 1 or c == grid_cells - 4:
                    draw.rectangle([qr_x0 + c * cell_w, qr_y0 + r * cell_w, qr_x0 + (c + 1) * cell_w - 1, qr_y0 + (r + 1) * cell_w - 1], fill="#111111")
                elif (1 <= r <= 2 and 1 <= c <= 2) or (1 <= r <= 2 and grid_cells - 3 <= c <= grid_cells - 2) or (grid_cells - 3 <= r <= grid_cells - 2 and 1 <= c <= 2):
                    draw.rectangle([qr_x0 + c * cell_w, qr_y0 + r * cell_w, qr_x0 + (c + 1) * cell_w - 1, qr_y0 + (r + 1) * cell_w - 1], fill="#111111")
            else:
                # Deterministic pattern
                if (r * 7 + c * 13 + r * c) % 3 != 0:
                    draw.rectangle([qr_x0 + c * cell_w, qr_y0 + r * cell_w, qr_x0 + (c + 1) * cell_w - 1, qr_y0 + (r + 1) * cell_w - 1], fill="#111111")

    # Laser Scan Line Animation (frames 645-685)
    if 45 <= local_f <= 85:
        scan_prog = (local_f - 45) / 40.0
        scan_y = qr_y0 + int(qr_sz * scan_prog)
        # Laser line
        draw.line([(qr_x0 - 15, scan_y), (qr_x0 + qr_sz + 15, scan_y)], fill="#8bcf19", width=3)
        # Laser glow
        draw.line([(qr_x0 - 10, scan_y - 2), (qr_x0 + qr_sz + 10, scan_y - 2)], fill="#a8e62e", width=1)
        draw.line([(qr_x0 - 10, scan_y + 2), (qr_x0 + qr_sz + 10, scan_y + 2)], fill="#a8e62e", width=1)
        
    # Verification Badge Reveal (frames 680-749)
    if local_f >= 80:
        v_prog = ease_out_cubic((local_f - 80) / 20.0)
        v_scale = v_prog
        b_w = int(460 * v_scale)
        b_h = 50
        b_x0 = cur_cx - b_w // 2
        b_y0 = y0 + 600
        
        draw.rounded_rectangle([b_x0, b_y0, b_x0 + b_w, b_y0 + b_h], radius=25, fill="#8bcf19")
        if v_prog > 0.6:
            draw.text((cur_cx - 155, b_y0 + 13), "IDENTITY VERIFIED • ACCESS GRANTED ✓", fill="#090909", font=get_font(15, bold=True))

    return img


def render_scene_6(frame_idx):
    """
    Scene 6: JOIN CAMPUSCODE (frames 750-959, 25-32s)
    - Frames 750-810: "YOUR NEXT PROJECT STARTS HERE." fades in, background darkens to #090909.
    - Frames 810-870: "JOIN CAMPUSCODE" appears large and bold.
    - Frames 870-920: The 3-bar logo mark appears (white/purple/lime on dark background).
    - Frames 920-959: Gentle fade to black with musical resolution.
    """
    local_f = frame_idx - 750
    
    # Smooth transition from warm off-white #f7f7f4 to obsidian #090909 (frames 750-785)
    bg_prog = ease_in_out(min(1.0, max(0.0, local_f / 35.0)))
    bg_r = int(247 + (9 - 247) * bg_prog)
    bg_g = int(247 + (9 - 247) * bg_prog)
    bg_b = int(244 + (9 - 244) * bg_prog)
    
    # Global fade to pitch black at the end (frames 925-959)
    if frame_idx >= 925:
        fade_out = ease_in_out((frame_idx - 925) / 34.0)
        bg_r = int(bg_r * (1.0 - fade_out))
        bg_g = int(bg_g * (1.0 - fade_out))
        bg_b = int(bg_b * (1.0 - fade_out))
        
    img = Image.new("RGB", (WIDTH, HEIGHT), (bg_r, bg_g, bg_b))
    draw = ImageDraw.Draw(img)
    
    # Draw faint dark grid when dark background is active
    if bg_prog > 0.5:
        grid_alpha = int(25 * bg_prog)
        g_col = (grid_alpha, grid_alpha, grid_alpha)
        for x in range(0, WIDTH, 42):
            draw.line([(x, 0), (x, HEIGHT)], fill=g_col, width=1)
        for y in range(0, HEIGHT, 42):
            draw.line([(0, y), (WIDTH, y)], fill=g_col, width=1)

    f_sub = get_font(26, mono=True)
    f_huge = get_font(96, bold=True)
    f_brand = get_font(72, bold=True)
    f_tag = get_font(20, mono=True)
    
    # Global fade multiplier for text elements during final fade
    text_fade = 1.0
    if frame_idx >= 925:
        text_fade = max(0.0, 1.0 - ease_in_out((frame_idx - 925) / 30.0))
        
    # Phase 1: "YOUR NEXT PROJECT STARTS HERE." (frames 750-810)
    p1_alpha = ease_out_cubic(min(1.0, max(0.0, (local_f - 10) / 30.0)))
    if local_f > 60:
        # Fades slightly and slides up to make room for "JOIN CAMPUSCODE"
        fade_down = min(1.0, (local_f - 60) / 25.0)
        p1_alpha = max(0.35, 1.0 - 0.65 * fade_down)
        y_shift = int(fade_down * 60)
    else:
        y_shift = 0
        
    p1_alpha *= text_fade
    if p1_alpha > 0.05:
        col_val = int(255 * p1_alpha)
        draw.text((WIDTH // 2 - 280, 390 - y_shift), "YOUR NEXT PROJECT STARTS HERE.", fill=(col_val, col_val, col_val), font=f_sub)

    # Phase 2: "JOIN CAMPUSCODE" (frames 810-870)
    if local_f >= 55:
        p2_prog = ease_out_cubic(min(1.0, (local_f - 55) / 30.0))
        p2_alpha = p2_prog * text_fade
        
        # In frame 870+, it shifts slightly down as the 3-bar logo appears above
        if local_f >= 115:
            logo_shift = min(1.0, (local_f - 115) / 20.0)
            target_y = int(470 + logo_shift * 80)
        else:
            target_y = 470
            
        cur_y = int(target_y + (1.0 - p2_prog) * 30)
        
        c_val = int(255 * p2_alpha)
        draw.text((WIDTH // 2 - 470, cur_y), "JOIN CAMPUSCODE", fill=(c_val, c_val, c_val), font=f_huge)
        
        # Subtitle pill
        if p2_prog > 0.7:
            sub_alpha = ((p2_prog - 0.7) / 0.3) * text_fade
            lime_r = int(139 * sub_alpha)
            lime_g = int(207 * sub_alpha)
            lime_b = int(25 * sub_alpha)
            draw.text((WIDTH // 2 - 260, cur_y + 125), "THE ARENA IS OPEN. BUILD SOMETHING REAL.", fill=(lime_r, lime_g, lime_b), font=f_tag)

    # Phase 3: The 3-Bar Logo Mark & Wordmark (frames 865-925)
    if local_f >= 115:
        logo_prog = ease_out_cubic(min(1.0, (local_f - 115) / 25.0))
        logo_alpha = logo_prog * text_fade
        
        # Draw 3 skewed bars hero logo
        logo_cx = WIDTH // 2
        logo_cy = 280
        
        # Skewed bars scaling
        scale = 1.6 * logo_prog
        w = 18 * scale
        h = 92 * scale
        gap = 14 * scale
        skew = -17.0
        
        total_w = 3 * w + 2 * gap
        start_x = logo_cx - total_w / 2.0
        start_y = logo_cy - h / 2.0
        
        # Bar 1: White
        b1_col = (int(255 * logo_alpha), int(255 * logo_alpha), int(255 * logo_alpha))
        draw_skewed_bar(draw, start_x, start_y, w, h, skew, b1_col)
        
        # Bar 2: Electric purple
        b2_col = (int(117 * logo_alpha), int(102 * logo_alpha), int(255 * logo_alpha))
        draw_skewed_bar(draw, start_x + w + gap, start_y, w, h, skew, b2_col)
        
        # Bar 3: Lime green
        b3_col = (int(139 * logo_alpha), int(207 * logo_alpha), int(25 * logo_alpha))
        draw_skewed_bar(draw, start_x + (w + gap) * 2, start_y, w, h, skew, b3_col)
        
        # URL button at bottom
        btn_prog = min(1.0, max(0.0, (local_f - 130) / 20.0)) * text_fade
        if btn_prog > 0:
            btn_w = 340
            btn_h = 44
            btn_x = WIDTH // 2 - btn_w // 2
            btn_y = 780
            draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=22, outline="#7665ff", width=1)
            draw.text((btn_x + 36, btn_y + 12), "campus-code-ten.vercel.app", fill="#ffffff", font=get_font(15, mono=True))

    return img


def render_single_frame(frame_idx):
    """Router to render any of the 960 frames."""
    if frame_idx < 120:
        img = render_scene_1(frame_idx)
    elif frame_idx < 270:
        # Crossfade transition (frames 120-135)
        if frame_idx < 135:
            img1 = render_scene_1(frame_idx)
            img2 = render_scene_2(frame_idx)
            alpha = (frame_idx - 120) / 15.0
            img = Image.blend(img1, img2, alpha)
        else:
            img = render_scene_2(frame_idx)
    elif frame_idx < 450:
        # Crossfade transition (frames 270-285)
        if frame_idx < 285:
            img2 = render_scene_2(frame_idx)
            img3 = render_scene_3(frame_idx)
            alpha = (frame_idx - 270) / 15.0
            img = Image.blend(img2, img3, alpha)
        else:
            img = render_scene_3(frame_idx)
    elif frame_idx < 600:
        # Crossfade transition (frames 450-465)
        if frame_idx < 465:
            img3 = render_scene_3(frame_idx)
            img4 = render_scene_4(frame_idx)
            alpha = (frame_idx - 450) / 15.0
            img = Image.blend(img3, img4, alpha)
        else:
            img = render_scene_4(frame_idx)
    elif frame_idx < 750:
        # Crossfade transition (frames 600-615)
        if frame_idx < 615:
            img4 = render_scene_4(frame_idx)
            img5 = render_scene_5(frame_idx)
            alpha = (frame_idx - 600) / 15.0
            img = Image.blend(img4, img5, alpha)
        else:
            img = render_scene_5(frame_idx)
    else:
        # Scene 6 handles its own smooth transition to dark
        img = render_scene_6(frame_idx)
        
    out_path = os.path.join(FRAMES_DIR, f"frame_{frame_idx:04d}.png")
    img.save(out_path, format="PNG", compress_level=1) # compress_level 1 for high speed
    return frame_idx

def render_worker_chunk(chunk):
    results = []
    for f in chunk:
        render_single_frame(f)
        results.append(f)
    return len(results)

def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    print(f"Starting parallel frame rendering for {TOTAL_FRAMES} frames...")
    
    cpu_count = min(8, multiprocessing.cpu_count())
    print(f"Utilizing {cpu_count} CPU worker processes.")
    
    # Split frames into chunks for workers
    chunk_size = 30
    all_frames = list(range(TOTAL_FRAMES))
    chunks = [all_frames[i:i + chunk_size] for i in range(0, len(all_frames), chunk_size)]
    
    with multiprocessing.Pool(processes=cpu_count) as pool:
        completed = 0
        for count in pool.imap_unordered(render_worker_chunk, chunks):
            completed += count
            if completed % 120 == 0 or completed == TOTAL_FRAMES:
                pct = (completed / TOTAL_FRAMES) * 100.0
                print(f"Rendered {completed}/{TOTAL_FRAMES} frames ({pct:.1f}%)")
                
    print("All frames rendered successfully.")

if __name__ == "__main__":
    main()
