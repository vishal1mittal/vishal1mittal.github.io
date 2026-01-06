
import zipfile
import re
import os
import json
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as zf:
            xml_content = zf.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Namespace for Word
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            text_parts = []
            for p in tree.findall('.//w:p', namespaces):
                texts = [node.text for node in p.findall('.//w:t', namespaces) if node.text]
                if texts:
                    text_parts.append(''.join(texts))
            
            return '\n'.join(text_parts)
    except Exception as e:
        return f"Error reading {docx_path}: {e}"

def main():
    data_dir = r"c:\Users\tmtec\OneDrive\Documents\GitHub\vishal1mittal.github.io\data"
    files = [f for f in os.listdir(data_dir) if f.endswith('.docx')]
    
    results = {}
    for f in files:
        path = os.path.join(data_dir, f)
        print(f"Extracting {f}...")
        text = extract_text_from_docx(path)
        results[f] = text

    output_file = r"c:\Users\tmtec\OneDrive\Documents\GitHub\vishal1mittal.github.io\data\extracted_content.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=4)
    
    print(f"Done. Extracted content to {output_file}")

if __name__ == "__main__":
    main()
