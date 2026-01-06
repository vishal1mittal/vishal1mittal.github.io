import json
import re

def enhance_text(text):
    # Dictionary of enhancements (applied to curriculum items only)
    replacements = {
        r'^Introduction [Tt]o\s+': 'Fundamentals of ',
        r'^Basic [Oo]f\s+': 'Core Concepts of ',
        r'^Basics [Oo]f\s+': 'Core Concepts of ',
        r'^Working [Ww]ith\s+': 'Mastering ',
        r'^How [Tt]o\s+': 'Techniques for ',
        r'^Overview [Oo]f\s+': 'Comprehensive Overview of ',
        r'Diffrence': 'Difference',
        r'\s+&+\s+': ' & ',
    }
    
    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text)
    
    # Capitalize first letter
    if text:
        text = text[0].upper() + text[1:]
        
    return text.strip()

def get_title_from_text(text, default_title):
    # Extract title from the first non-empty line
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line or len(line) < 4:
            continue
            
        # Stop if we hit a module definition immediately
        if line.lower().startswith('module') or line.lower().startswith('unit'):
            break

        # Clean up the line to be a title
        # Remove "Syllabus", "Duration", time periods, common filler
        title = re.sub(r'\s*[\(\-]?\s*(Duration|Syllabus|Total|Hrs|Hours|Months|Days|Week).*$', '', line, flags=re.IGNORECASE)
        title = re.sub(r'\s*\d+\s*[\-\s]*(Month|Day|Year)s?', '', title, flags=re.IGNORECASE)
        title = re.sub(r'[\(\)]', '', title)
        
        # If sensible length, use it
        if 4 < len(title) < 60:
            return title.strip().title() # Title Case
            
    return default_title

def parse_syllabus(text):
    lines = text.split('\n')
    curriculum = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.match(r'^(Module|Unit|Session|Month|Topic|Chapter)\s+\d+', line, re.IGNORECASE) or \
           re.match(r'^\d+\.\s+', line):
            item = re.sub(r'^(Module|Unit|Session|Month|Topic|Chapter)\s+\d+[:\-\s]*', '', line, flags=re.IGNORECASE)
            item = re.sub(r'^\d+\.\s+', '', item)
            item = re.sub(r'\(\d+\s*(Marks|Days|Months)\)', '', item, flags=re.IGNORECASE).strip()
            
            if item and len(item) > 3: 
                item = enhance_text(item)
                curriculum.append(item)
    
    if not curriculum:
        raw_items = [l.strip() for l in lines if l.strip() and len(l) > 5 and not l.lower().startswith("duration") and not l.lower().startswith("topics")][:15]
        curriculum = [enhance_text(i) for i in raw_items]
        
    return curriculum[:20]

def create_course(id, title, desc, duration, image_url="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"):
    return {
        "id": id,
        "title": title,
        "short_desc": desc,
        "description": desc,
        "duration": duration,
        "level": "Beginner to Advanced",
        "image": image_url,
        "curriculum": [],
        "projects": []
    }

def main():
    with open('data/extracted_content.json', 'r', encoding='utf-8') as f:
        extracted = json.load(f)
        
    new_courses = []

    # Helper to process a file and specific metadata
    def process_file(filename, id, default_desc, duration):
        text = extracted.get(filename, '')
        
        # Use filename as title, stripped of extension
        import os
        actual_title = os.path.splitext(filename)[0]
        
        # Optional: Title Case for better presentation, unless user wants raw
        # "BUSY SYLLABUS DURATION 2 MONTHS" -> "Busy Syllabus Duration 2 Months"
        # sensible cleanup: remove extra spaces
        actual_title = " ".join(actual_title.split())
        
        course = create_course(id, actual_title, default_desc, duration)
        course['curriculum'] = parse_syllabus(text)
        new_courses.append(course)

    # 1. Busy
    process_file('BUSY SYLLABUS DURATION 2 MONTHS.docx', 'busy-accounting', 
                 'Complete Business Accounting.', '2 Months')

    # 2. Corel
    process_file('COREL DRAW SYLLABUS 2 MONTHS.docx', 'corel-draw', 
                 'Vector Graphics Design.', '2 Months')

    # 3. Digital Marketing
    process_file('DIGITAL MARKETING COURSE 6 MONTHS .docx', 'digital-marketing', 
                 'Online Marketing Strategy.', '6 Months')

    # 4. English
    process_file('ENGLISH COURSE 4 MONTHS.docx', 'english-speaking', 
                 'Communication Skills.', '4 Months')

    # 5. HTML
    process_file('HTML SYLLABUS.docx', 'web-designing-html', 
                 'Web Structure Basics.', '1 Month')

    # 6. Java
    process_file('JAVA SYLLABUS 2 MONTHS.docx', 'java-programming', 
                 'Core Java Concepts.', '2 Months')

    # 7. Excel
    process_file('Ms Advanced Excel Syllabus.docx', 'advanced-excel', 
                 'Spreadsheet Mastery.', '45 Days')

    # 8. Word
    process_file('Ms-Word Syllabus.docx', 'ms-word', 
                 'Document Creation.', '1 Month')

    # 9. O Level
    process_file('O LEVEL COURSE SYLLABUS.docx', 'o-level', 
                 'IT Foundation Course.', '1 Year')

    # 10. Photoshop
    process_file('PHOTOSHOP SYLLABUS 2 MONTHS.docx', 'adobe-photoshop', 
                 'Photo Editing.', '2 Months')

    # 11. PowerPoint
    process_file('POWERPOINT COURSE SYLLABUS 15 DAYS.docx', 'ms-powerpoint', 
                 'Presentation Design.', '15 Days')

    # 12. Class 12 IP
    process_file('PYTHON CLASS 12 INFORMATICS PRACTICES SYLLABUS 2025.docx', 'class-12-ip', 
                 'Data Handling.', '4 Months')

    # 13. Python Complete
    process_file('PYTHON COMPLETE COURSE 4 MONTHS.docx', 'python-complete', 
                 'Complete Python Course.', '4 Months')

    # 14. Class 12 CS
    process_file('PYTHON SYLLABUS CLASS 12 CS.docx', 'class-12-cs', 
                 'CBSE CS Curriculum.', '1 Year')

    # 15. Tally
    process_file('Tally Syllabus for Web Site.docx', 'tally-prime', 
                 'Accounting & Inventory.', '3 Months')

    with open('data/data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data['courses'] = new_courses
    
    with open('data/data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print(f"Rebuilt data.json with {len(new_courses)} courses using document titles.")

if __name__ == "__main__":
    main()
