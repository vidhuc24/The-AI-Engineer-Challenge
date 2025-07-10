#!/usr/bin/env python3
"""
Python Documentation Collector
Collects and processes Python documentation for RAG system
"""

import os
import requests
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import re

class PythonDocsCollector:
    def __init__(self, output_dir="data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.base_url = "https://docs.python.org/3/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; PythonDocsCollector/1.0)'
        })
    
    def download_page(self, url, max_retries=3, delay=1):
        """Download a single page with retry logic"""
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return response.text
            except Exception as e:
                print(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                else:
                    print(f"Failed to download {url} after {max_retries} attempts")
                    return None
    
    def clean_html_content(self, html_content):
        """Extract clean text from HTML"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove navigation, footer, and other non-content elements
        for element in soup.find_all(['nav', 'footer', 'script', 'style', '.headerlink']):
            element.decompose()
        
        # Get the main content
        main_content = soup.find('div', class_='body') or soup.find('main') or soup
        
        # Extract text and clean it up
        text = main_content.get_text(separator='\n', strip=True)
        
        # Clean up the text
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)  # Remove excessive newlines
        text = re.sub(r'¶\s*', '', text)  # Remove paragraph symbols
        text = re.sub(r'\s+', ' ', text, flags=re.MULTILINE)  # Normalize whitespace
        
        return text.strip()
    
    def save_content(self, filename, content, title=""):
        """Save content to a file"""
        filepath = self.output_dir / f"{filename}.txt"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            if title:
                f.write(f"# {title}\n\n")
            f.write(content)
        
        print(f"Saved: {filepath} ({len(content)} characters)")
    
    def collect_tutorial(self):
        """Collect Python Tutorial content"""
        print("Collecting Python Tutorial...")
        
        tutorial_sections = [
            ("tutorial/index.html", "python_tutorial_overview"),
            ("tutorial/introduction.html", "python_introduction"),
            ("tutorial/interpreter.html", "python_interpreter"),
            ("tutorial/controlflow.html", "python_control_flow"),
            ("tutorial/datastructures.html", "python_data_structures"),
            ("tutorial/modules.html", "python_modules"),
            ("tutorial/inputoutput.html", "python_input_output"),
            ("tutorial/errors.html", "python_errors_exceptions"),
            ("tutorial/classes.html", "python_classes"),
            ("tutorial/stdlib.html", "python_standard_library"),
            ("tutorial/stdlib2.html", "python_standard_library_2")
        ]
        
        for section_url, filename in tutorial_sections:
            url = urljoin(self.base_url, section_url)
            html_content = self.download_page(url)
            
            if html_content:
                clean_content = self.clean_html_content(html_content)
                title = f"Python Tutorial - {filename.replace('python_', '').replace('_', ' ').title()}"
                self.save_content(filename, clean_content, title)
                time.sleep(0.5)  # Be respectful to the server
    
    def collect_library_reference(self):
        """Collect key Library Reference sections"""
        print("Collecting Library Reference...")
        
        library_sections = [
            ("library/functions.html", "python_builtin_functions"),
            ("library/constants.html", "python_builtin_constants"),
            ("library/types.html", "python_builtin_types"),
            ("library/exceptions.html", "python_builtin_exceptions"),
            ("library/stdtypes.html", "python_standard_types"),
            ("library/string.html", "python_string_methods"),
            ("library/re.html", "python_regular_expressions"),
            ("library/datetime.html", "python_datetime"),
            ("library/collections.html", "python_collections"),
            ("library/itertools.html", "python_itertools"),
            ("library/functools.html", "python_functools"),
            ("library/os.html", "python_os_module"),
            ("library/sys.html", "python_sys_module"),
            ("library/pathlib.html", "python_pathlib"),
            ("library/json.html", "python_json"),
            ("library/csv.html", "python_csv"),
            ("library/urllib.html", "python_urllib"),
            ("library/http.html", "python_http"),
            ("library/logging.html", "python_logging"),
            ("library/unittest.html", "python_unittest")
        ]
        
        for section_url, filename in library_sections:
            url = urljoin(self.base_url, section_url)
            html_content = self.download_page(url)
            
            if html_content:
                clean_content = self.clean_html_content(html_content)
                title = f"Python Library - {filename.replace('python_', '').replace('_', ' ').title()}"
                self.save_content(filename, clean_content, title)
                time.sleep(0.5)  # Be respectful to the server
    
    def collect_language_reference(self):
        """Collect Language Reference sections"""
        print("Collecting Language Reference...")
        
        reference_sections = [
            ("reference/introduction.html", "python_language_intro"),
            ("reference/lexical_analysis.html", "python_lexical_analysis"),
            ("reference/datamodel.html", "python_data_model"),
            ("reference/expressions.html", "python_expressions"),
            ("reference/simple_stmts.html", "python_simple_statements"),
            ("reference/compound_stmts.html", "python_compound_statements"),
            ("reference/toplevel_components.html", "python_toplevel"),
            ("reference/import.html", "python_import_system")
        ]
        
        for section_url, filename in reference_sections:
            url = urljoin(self.base_url, section_url)
            html_content = self.download_page(url)
            
            if html_content:
                clean_content = self.clean_html_content(html_content)
                title = f"Python Reference - {filename.replace('python_', '').replace('_', ' ').title()}"
                self.save_content(filename, clean_content, title)
                time.sleep(0.5)  # Be respectful to the server
    
    def create_manual_content(self):
        """Create some manual Python content for immediate testing"""
        print("Creating manual Python content...")
        
        basic_concepts = """# Python Basics - Variables and Data Types

Python is a dynamically-typed programming language, which means you don't need to declare variable types explicitly.

## Variables
Variables in Python are created when you assign a value to them. Variable names should be descriptive and follow these rules:
- Start with a letter or underscore
- Can contain letters, numbers, and underscores
- Are case-sensitive
- Cannot be Python keywords

Examples:
```python
name = "Alice"
age = 25
height = 5.6
is_student = True
```

## Data Types

### Numbers
- **Integers (int)**: Whole numbers like 42, -17, 0
- **Floats (float)**: Decimal numbers like 3.14, -2.5, 1.0
- **Complex**: Numbers with real and imaginary parts like 2+3j

### Strings (str)
Text data enclosed in quotes:
```python
single_quoted = 'Hello'
double_quoted = "World"
multiline = '''This is a
multiline string'''
```

### Booleans (bool)
True or False values:
```python
is_valid = True
is_empty = False
```

### Collections
- **Lists**: Ordered, mutable collections `[1, 2, 3]`
- **Tuples**: Ordered, immutable collections `(1, 2, 3)`
- **Dictionaries**: Key-value pairs `{"name": "Alice", "age": 25}`
- **Sets**: Unordered collections of unique items `{1, 2, 3}`

## Type Checking
Use the `type()` function to check variable types:
```python
print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type("hello"))   # <class 'str'>
```
"""

        functions_content = """# Python Functions

Functions are reusable blocks of code that perform specific tasks. They help organize code and avoid repetition.

## Defining Functions
Use the `def` keyword to define a function:
```python
def greet(name):
    return f"Hello, {name}!"

# Call the function
message = greet("Alice")
print(message)  # Output: Hello, Alice!
```

## Function Components
1. **Function name**: Should be descriptive (greet)
2. **Parameters**: Input values in parentheses (name)
3. **Body**: Indented code block
4. **Return statement**: Optional, returns a value

## Parameters and Arguments

### Default Parameters
```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Alice")              # Hello, Alice!
greet("Bob", "Hi")          # Hi, Bob!
```

### Keyword Arguments
```python
def create_user(name, age, city="Unknown"):
    return f"{name}, {age} years old from {city}"

# Using keyword arguments
user = create_user(name="Alice", age=25, city="New York")
```

### Variable Arguments
```python
def sum_numbers(*args):
    return sum(args)

result = sum_numbers(1, 2, 3, 4, 5)  # Returns 15
```

### Keyword Variable Arguments
```python
def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25, city="New York")
```

## Lambda Functions
Short, anonymous functions:
```python
square = lambda x: x ** 2
print(square(5))  # Output: 25

# Used with map, filter, etc.
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
```

## Scope and Variables
- **Local scope**: Variables defined inside functions
- **Global scope**: Variables defined outside functions
- **Global keyword**: Access global variables inside functions
```python
global_var = "I'm global"

def my_function():
    local_var = "I'm local"
    global global_var
    global_var = "Modified global"
```
"""

        control_flow = """# Python Control Flow

Control flow statements determine the order in which code executes.

## Conditional Statements

### if, elif, else
```python
age = 18

if age < 13:
    print("Child")
elif age < 18:
    print("Teenager")
else:
    print("Adult")
```

### Comparison Operators
- `==` Equal to
- `!=` Not equal to
- `<` Less than
- `>` Greater than
- `<=` Less than or equal to
- `>=` Greater than or equal to

### Logical Operators
- `and` Both conditions must be true
- `or` Either condition can be true
- `not` Negates the condition

```python
age = 25
has_license = True

if age >= 18 and has_license:
    print("Can drive")
```

## Loops

### for Loops
Iterate over sequences:
```python
# Iterate over a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)

# Iterate over a range
for i in range(5):
    print(i)  # Prints 0, 1, 2, 3, 4

# Iterate with index
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")
```

### while Loops
Execute while condition is true:
```python
count = 0
while count < 5:
    print(count)
    count += 1
```

### Loop Control
- `break`: Exit the loop
- `continue`: Skip to next iteration
- `else`: Execute if loop completes normally

```python
for i in range(10):
    if i == 3:
        continue  # Skip 3
    if i == 7:
        break     # Stop at 7
    print(i)
else:
    print("Loop completed normally")
```

## Exception Handling

### try, except, finally
```python
try:
    number = int(input("Enter a number: "))
    result = 10 / number
    print(f"Result: {result}")
except ValueError:
    print("Invalid input! Please enter a number.")
except ZeroDivisionError:
    print("Cannot divide by zero!")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    print("This always executes")
```

### Common Exceptions
- `ValueError`: Invalid value for operation
- `TypeError`: Wrong data type
- `IndexError`: Index out of range
- `KeyError`: Key not found in dictionary
- `FileNotFoundError`: File doesn't exist
"""

        # Save the manual content
        self.save_content("python_basics_variables_types", basic_concepts)
        self.save_content("python_functions", functions_content)
        self.save_content("python_control_flow", control_flow)
    
    def run_collection(self):
        """Run the complete collection process"""
        print("Starting Python Documentation Collection...")
        
        # Start with manual content for immediate testing
        self.create_manual_content()
        
        # Then collect from official docs
        try:
            self.collect_tutorial()
            self.collect_library_reference()
            self.collect_language_reference()
        except Exception as e:
            print(f"Error during collection: {e}")
            print("Don't worry - we have manual content to start with!")
        
        print(f"\nCollection complete! Check the '{self.output_dir}' directory for files.")
        
        # Show summary
        files = list(self.output_dir.glob("*.txt"))
        total_size = sum(f.stat().st_size for f in files)
        print(f"Total files: {len(files)}")
        print(f"Total size: {total_size / 1024:.1f} KB")

if __name__ == "__main__":
    collector = PythonDocsCollector()
    collector.run_collection() 