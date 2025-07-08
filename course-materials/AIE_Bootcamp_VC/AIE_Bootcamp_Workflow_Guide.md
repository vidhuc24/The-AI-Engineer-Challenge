# 🚀 AI Engineer Bootcamp - Complete Workflow Guide

## 📋 **Your Setup Summary**

### **Repository Configuration:**
- **Workspace:** `/Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC`
- **Your Fork:** `git@github.com:vidhuc24/AIE_Bootcamp_VC.git` (origin)
- **Official Bootcamp:** `git@github.com:AI-Maker-Space/AIE7.git` (upstream)
- **Extra Content:** `git@github.com:AI-Maker-Space/Beyond-ChatGPT.git` (BC)

### **Python Environment:**
- **Path:** `/Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC/activate/bin/python`
- **Version:** Python 3.13.3
- **Environment Name:** `(activate)`
- **Key Packages:** OpenAI 1.84.0, Streamlit 1.45.1, Pandas 2.3.0, + 80 others

### **Directory Structure:**
```
📁 AIE_Bootcamp/
└── 📁 AIE_Bootcamp_VC/          ← YOUR WORKSPACE
    ├── 📁 activate/             ← Virtual Environment
    ├── 📁 00_Onramp/            ← Onramp Modules (01-06)
    ├── 📁 01_Prompt Engineering and Prototyping Best Practices/
    ├── 📁 02_Embeddings_and_RAG/
    ├── 📁 frontend/             ← React Frontend
    ├── 📁 api/                  ← Backend API
    ├── 📁 docs/                 ← Documentation
    └── hello.py                 ← Your Code Files
```

---

## 🚀 **BEFORE WORKFLOW** (Starting Your Bootcamp Session)

### **Step 1: Navigate & Activate Environment**

**Mac Terminal:**
```bash
cd /Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC
```
**Expected Output:**
```
ashapondicherry@MacBookPro AIE_Bootcamp_VC %
```

**Mac Terminal:**
```bash
source activate/bin/activate
```
**Expected Output:**
```
(activate) ashapondicherry@MacBookPro AIE_Bootcamp_VC %
```

**Mac Terminal:**
```bash
pwd && which python
```
**Expected Output:**
```
/Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC
/Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC/activate/bin/python
```

### **Step 2: Check Current Status**

**Mac Terminal:**
```bash
git status
```
**Expected Output (if clean):**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```
**Expected Output (if you have changes):**
```
On branch main
Changes not staged for commit:
        modified:   some_file.py
Untracked files:
        new_file.ipynb
```

**Mac Terminal:**
```bash
git branch
```
**Expected Output:**
```
  BCBranch
  LocalDev
  feature-hello-world
* main
```

**Mac Terminal:**
```bash
git fetch origin
git status
```
**Expected Output:**
```
(no output from fetch if up to date)
On branch main
Your branch is up to date with 'origin/main'.
```

### **Step 3: (Optional) Sync with Upstream for New Content**

**Mac Terminal:**
```bash
git fetch upstream
```
**Expected Output (if updates available):**
```
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (15/15), done.
remote: Total 15 (delta 8), reused 12 (delta 5)
Unpacking objects: 100% (15/15), 2.45 KiB | 1.22 MiB/s, done.
From github.com:AI-Maker-Space/AIE7
   d2e3670..a1b2c3d  main       -> upstream/main
```
**Expected Output (if no updates):**
```
(no output - means you're current)
```

**Mac Terminal:**
```bash
git log HEAD..upstream/main --oneline
```
**Expected Output (if updates available):**
```
a1b2c3d Session 03 - Advanced RAG
b2c3d4e Session 03 - Vector Databases
```
**Expected Output (if no updates):**
```
(no output - you're up to date)
```

**If there are updates, run these commands:**

**Mac Terminal:**
```bash
git add . && git commit -m "Save work before sync"
```
**Expected Output:**
```
[main e4f5g6h] Save work before sync
 3 files changed, 45 insertions(+), 2 deletions(-)
```

**Mac Terminal:**
```bash
git merge upstream/main --allow-unrelated-histories
```
**Expected Output (if successful):**
```
Merge made by the 'recursive' strategy.
 Session_03/README.md | 25 +++++++++++++++++++++++++
 Session_03/rag_app.py | 87 +++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 112 insertions(+)
```

**Mac Terminal:**
```bash
git push origin main
```
**Expected Output:**
```
Enumerating objects: 12, done.
Counting objects: 100% (12/12), done.
Writing objects: 100% (8/8), 1.23 KiB | 1.23 MiB/s, done.
To github.com:vidhuc24/AIE_Bootcamp_VC.git
   d2e3670..f7g8h9i  main -> main
```

### **Step 4: Open Cursor & Set Interpreter**

**Mac Terminal:**
```bash
cursor .
```
**Expected Output:**
```
(Cursor application opens, no terminal output)
```

**In Cursor UI:**
1. Press `Cmd+Shift+P`
2. Type "Python: Select Interpreter"
3. Select: `/Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC/activate/bin/python`
4. **Expected Result:** Bottom status bar shows `Python 3.13.3 ('activate': venv)`

---

## 💾 **AFTER WORKFLOW** (Ending Your Bootcamp Session)

### **Step 1: Save Your Work**

**Cursor Terminal OR Mac Terminal:**
```bash
git status
```
**Expected Output:**
```
On branch main
Changes not staged for commit:
        modified:   02_Embeddings_and_RAG/my_rag_app.py
        modified:   hello.py

Untracked files:
        my_notes.md
        test_embedding.ipynb
```

**Cursor Terminal OR Mac Terminal:**
```bash
git add .
```
**Expected Output:**
```
(no output - means successful)
```

**Cursor Terminal OR Mac Terminal:**
```bash
git commit -m "Session [DATE]: [What you worked on]

- Added/modified: [specific files]
- Completed: [assignments/exercises]
- Notes: [any important notes]"
```
**Expected Output:**
```
[main j8k9l0m] Session Jan 2: Completed RAG assignment
 4 files changed, 156 insertions(+), 12 deletions(-)
 create mode 100644 my_notes.md
 create mode 100644 test_embedding.ipynb
```

### **Step 2: Push to Your Fork**

**Cursor Terminal OR Mac Terminal:**
```bash
git push origin main
```
**Expected Output:**
```
Enumerating objects: 8, done.
Counting objects: 100% (8/8), done.
Delta compression using up to 8 threads
Compressing objects: 100% (5/5), done.
Writing objects: 100% (6/6), 2.34 KiB | 2.34 MiB/s, done.
To github.com:vidhuc24/AIE_Bootcamp_VC.git
   f7g8h9i..n2o3p4q  main -> main
```

**Cursor Terminal OR Mac Terminal:**
```bash
git status
```
**Expected Output:**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

### **Step 3: (Optional) Clean Exit**

**Cursor Terminal OR Mac Terminal:**
```bash
deactivate
```
**Expected Output:**
```
ashapondicherry@MacBookPro AIE_Bootcamp_VC %
(note: (activate) disappears from prompt)
```

**Cursor Terminal OR Mac Terminal:**
```bash
git log --oneline -3
```
**Expected Output:**
```
n2o3p4q (HEAD -> main, origin/main) Session Jan 2: Completed RAG assignment
j8k9l0m Save work before sync
f7g8h9i Merge upstream/main: Add Sessions 01-02
```

---

## ⚡ **QUICK REFERENCE COMMANDS**

### **Daily Essentials:**

**Mac Terminal:**
```bash
# Quick start (one line)
cd ~/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC && source activate/bin/activate
```
**Expected Output:**
```
(activate) ashapondicherry@MacBookPro AIE_Bootcamp_VC %
```

**Cursor Terminal OR Mac Terminal:**
```bash
# Quick save (one line)
git add . && git commit -m "Work in progress" && git push origin main
```
**Expected Output:**
```
[main r5s6t7u] Work in progress
 2 files changed, 23 insertions(+), 5 deletions(-)
Enumerating objects: 6, done.
Writing objects: 100% (4/4), 567 bytes | 567.00 KiB/s, done.
To github.com:vidhuc24/AIE_Bootcamp_VC.git
   n2o3p4q..r5s6t7u  main -> main
```

**Cursor Terminal OR Mac Terminal:**
```bash
# Quick check
git status && which python
```
**Expected Output:**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
/Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC/activate/bin/python
```

### **Weekly Sync (one line):**

**Mac Terminal:**
```bash
git add . && git commit -m "Save before sync" && git fetch upstream && git merge upstream/main --allow-unrelated-histories && git push origin main
```

---

## 🚨 **TROUBLESHOOTING**

### **Environment Issues:**

**Mac Terminal OR Cursor Terminal:**
```bash
# If environment seems broken
deactivate && source activate/bin/activate
```
**Expected Output:**
```
ashapondicherry@MacBookPro AIE_Bootcamp_VC %
(activate) ashapondicherry@MacBookPro AIE_Bootcamp_VC %
```

**Cursor Terminal OR Mac Terminal:**
```bash
# Check if python packages seem missing
python -m pip list | grep openai
```
**Expected Output (if working):**
```
openai                    1.84.0
```
**If broken, you'll see:**
```
(no output - package not installed)
```

### **Git Issues:**

**Cursor Terminal OR Mac Terminal:**
```bash
# Always start with git status
git status
```

**Cursor Terminal OR Mac Terminal:**
```bash
# If you want to discard changes to a specific file
git restore filename.py
```
**Expected Output:**
```
(no output - file reverted to last committed version)
```

**Cursor Terminal OR Mac Terminal:**
```bash
# If you want to discard ALL changes
git restore .
```
**Expected Output:**
```
(no output - all files reverted to last committed version)
```

**Cursor Terminal OR Mac Terminal:**
```bash
# See what changed
git diff
```
**Expected Output:**
```
diff --git a/hello.py b/hello.py
index 1234567..abcdefg 100644
--- a/hello.py
+++ b/hello.py
@@ -1,3 +1,5 @@
 def hello():
-    print("Hello, World!")
+    print("Hello, AI Bootcamp!")
+    print("Let's build something amazing!")
```

### **Cursor-Specific Issues:**

**If Cursor can't find Python packages:**
1. Check bottom status bar shows: `Python 3.13.3 ('activate': venv)`
2. If not, press `Cmd+Shift+P` → "Python: Select Interpreter"
3. Select: `/Users/ashapondicherry/Desktop/VDU/_Projects/AIE_Bootcamp/AIE_Bootcamp_VC/activate/bin/python`

**If Cursor terminal doesn't show (activate):**
1. Close terminal in Cursor
2. Open new terminal (`Ctrl+` ` or Terminal → New Terminal)
3. Run: `source activate/bin/activate`

---

## 📚 **YOUR CURRENT BOOTCAMP CONTENT**

### **✅ Available Modules:**
- **00_Onramp:** 
  - onramp01: Cursor and Git
  - onramp02: Python Basics  
  - onramp03: Python Basics (your custom work)
  - onramp04: Fine-tuning (LLME Challenge)
  - onramp05: Alignment & RLHF
  - onramp06: MCP (Model Context Protocol)

- **01_Prompt Engineering and Prototyping Best Practices**
- **02_Embeddings_and_RAG** (with aimakerspace utilities)
- **00_AIM_Quicklinks** (navigation helpers)

### **✅ Key Packages Ready:**
- `openai 1.84.0` - AI API access
- `streamlit 1.45.1` - Web app framework
- `pandas 2.3.0` - Data manipulation
- `numpy 2.2.6` - Numerical computing
- `jupyter` - Notebook environment
- **+75 more packages** for AI/ML development

---

## 🎯 **BEST PRACTICES**

### **Git Workflow:**
- ✅ **Commit often** - small, meaningful commits
- ✅ **Descriptive messages** - explain what you did
- ✅ **Push daily** - don't lose work
- ✅ **Sync weekly** - get new bootcamp content

### **Development Workflow:**
- ✅ **Always activate environment first**
- ✅ **Check git status before starting**
- ✅ **Select correct Python interpreter in Cursor**
- ✅ **Test code in small chunks**

### **File Organization:**
- ✅ **Keep work in appropriate session folders**
- ✅ **Use descriptive filenames**
- ✅ **Add comments to your code**
- ✅ **Create notes files for learning**

---

## 📞 **EMERGENCY CONTACTS & RESOURCES**

### **If Everything Breaks:**
1. **Don't panic!** Your work is saved in git
2. **Check git status** - see what you can recover
3. **Deactivate and reactivate** environment
4. **Restart Cursor** and reselect interpreter
5. **Last resort:** Re-clone your fork

### **Key URLs:**
- **Your Fork:** `https://github.com/vidhuc24/AIE_Bootcamp_VC`
- **Official Bootcamp:** `https://github.com/AI-Maker-Space/AIE7`
- **Beyond ChatGPT:** `https://github.com/AI-Maker-Space/Beyond-ChatGPT`

---

**📝 Save this document! Reference it every time you start bootcamp work.**

**🚀 Happy coding and building amazing AI applications!** 