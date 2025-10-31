# style_mapper.py
# Future Phase 2: Context-aware style selection
# 
# This module will analyze photo content and metadata to choose
# appropriate art styles dynamically.

"""
Example usage:

analysis = {
    "subjects": ["baby"],
    "setting": "indoor",
    "decade": "1980s",
    "mood": "playful"
}

style = get_appropriate_style(analysis)
# Returns: "whimsical children's book illustration in the style of Dr. Seuss"
"""

STYLE_CATEGORIES = {
    "baby": [
        "whimsical children's book illustration in the style of Dr. Seuss",
        "colorful picture book style like Eric Carle",
        "gentle watercolor children's illustration like Beatrix Potter",
        "playful nursery art with soft pastels",
    ],
    
    "child": [
        "animated children's movie style like Pixar",
        "adventure book illustration like Maurice Sendak",
        "storybook painting with bright colors",
    ],
    
    "teenager": [
        "rock concert poster with bold graphics",
        "street art graffiti style",
        "album cover art with dramatic lighting",
        "skateboard graphic design aesthetic",
    ],
    
    "adult": [
        "classic Norman Rockwell Americana painting",
        "impressionist style with visible brushstrokes",
        "contemporary portrait photography aesthetic",
    ],
    
    "elderly": [
        "dignified oil painting portrait",
        "Rembrandt-style classical portrait with dramatic lighting",
        "warm and respectful photographic portrait",
    ],
    
    "1960s": [
        "psychedelic 60s poster art",
        "mod pop art style",
        "vintage photography with faded colors",
    ],
    
    "1970s": [
        "warm 70s photography with orange and brown tones",
        "disco era glamour photography",
        "retro illustration with groovy patterns",
    ],
    
    "1980s": [
        "synthwave neon aesthetic with pink and blue",
        "80s airbrush art style",
        "MTV music video aesthetic",
        "retro-futuristic with geometric shapes",
    ],
    
    "1990s": [
        "grunge aesthetic with muted tones",
        "90s disposable camera photography",
        "hip-hop album cover style",
    ],
    
    "outdoor": [
        "Hudson River School landscape painting",
        "plein air impressionism",
        "national park poster style",
    ],
    
    "holiday": [
        "festive warm painting with rich colors",
        "cozy holiday illustration",
        "Norman Rockwell holiday scene",
    ],
}


def detect_subjects(description: str) -> list[str]:
    """
    Analyze photo description to detect subject types.
    Returns list of subject categories: ['baby', 'outdoor', etc.]
    """
    # TODO: Use Gemini to classify subjects
    # For now, simple keyword matching
    subjects = []
    
    desc_lower = description.lower()
    
    if any(word in desc_lower for word in ['baby', 'infant', 'newborn']):
        subjects.append('baby')
    elif any(word in desc_lower for word in ['child', 'kid', 'toddler']):
        subjects.append('child')
    elif any(word in desc_lower for word in ['teenager', 'teen', 'adolescent']):
        subjects.append('teenager')
    elif any(word in desc_lower for word in ['elderly', 'senior', 'grandparent']):
        subjects.append('elderly')
    else:
        subjects.append('adult')
    
    if any(word in desc_lower for word in ['outdoor', 'outside', 'landscape', 'nature']):
        subjects.append('outdoor')
    
    if any(word in desc_lower for word in ['holiday', 'christmas', 'celebration']):
        subjects.append('holiday')
    
    return subjects


def detect_decade(filename: str, description: str) -> str | None:
    """
    Try to detect the decade from filename or description.
    Returns: "1960s", "1970s", "1980s", "1990s", etc. or None
    """
    # TODO: Extract EXIF date from image metadata
    # For now, look for year indicators in filename
    import re
    
    # Look for 4-digit years in filename
    year_match = re.search(r'(19\d{2}|20\d{2})', filename)
    if year_match:
        year = int(year_match.group(1))
        decade = (year // 10) * 10
        return f"{decade}s"
    
    # Look for decade mentions in description
    for decade in ['1960s', '1970s', '1980s', '1990s', '2000s']:
        if decade in description or decade[:-1] in description:
            return decade
    
    return None


def get_appropriate_style(analysis: dict, subjects: list[str], decade: str | None) -> str:
    """
    Choose an appropriate art style based on photo analysis.
    
    Args:
        analysis: Full Gemini vision analysis
        subjects: List of detected subjects (from detect_subjects)
        decade: Detected decade (from detect_decade)
    
    Returns:
        Prompt string for image generation
    """
    import random
    
    # Priority order: decade > specific subjects > general
    
    # 1. If decade detected, use decade-specific styles
    if decade and decade in STYLE_CATEGORIES:
        styles = STYLE_CATEGORIES[decade]
        return random.choice(styles)
    
    # 2. Check for specific subject types
    for subject in subjects:
        if subject in STYLE_CATEGORIES:
            styles = STYLE_CATEGORIES[subject]
            return random.choice(styles)
    
    # 3. Default to Norman Rockwell
    return "In the style of Norman Rockwell"


# Future enhancement: Let user define custom mappings
# def load_user_preferences():
#     """Load user's custom style preferences"""
#     pass

