# Changelog

## ptree: 0.0.1

- Initial release
- TextMate grammar for `.ptree`
- Smart folding provider (tree-depth aware)
- Commands to copy full/relative path at cursor
- Here’s a **full-scope, modern, shippable solution** for the `ptree` directory-tree language + `.ptree` file extension, based on the requirements in your draft:

- **Standard format (spec)**
- **Full TextMate grammar** (syntax highlighting)
- **Tree-aware folding** (collapse/expand in-editor)
- **Markdown fenced-code support** (```ptree)
- **Full documentation + samples**
- **Bonus QoL commands**: copy full/relative path at cursor

### Download the complete VS Code extension project

[Download the ptree VS Code extension project (.zip)](sandbox:/mnt/data/ptree-vscode-extension.zip)

Unzip it and you’ll have a ready-to-build VS Code extension repo.

---

### What you get (repo contents)

Inside the zip:

```text
0.0.1/
├── package.json
├── language-configuration.json
├── syntaxes/
│   └── ptree.tmLanguage.json
├── src/
│   └── extension.ts
├── docs/
│   └── SPEC.md
├── samples/
│   └── example.ptree
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .vscode/
    ├── launch.json
    └── tasks.json
```

#### Key design choice: folding cannot be “offSide”

Your draft mentioned `offSide` folding. That works for Python-style indentation, but **ptree depth is encoded in 4-character “tree segments”** (`│` and `    `), not pure leading whitespace.

So this solution implements a **real FoldingRangeProvider** that parses tree depth from the scaffold and produces correct collapsible regions.

---

### The ptree standard (format spec)

A clear standard is what makes tooling and adoption possible. This solution includes:

- **`docs/SPEC.md`** — “ptree Specification v1.0 (Draft)”

Highlights:

- UTF-8 text
- Optional directives: `@ptree: 1.0`, `@root: ...`, `@style: unicode`, etc.
- Root line recommended: `my-project/`
- Two supported skeleton styles:

  - Unicode: `├──`, `└──`, `│`, `    `
  - ASCII fallback: `|--`, `` `-- ``, `|`, `    `
- **Recommended canonical rule:** directories end with `/` for unambiguous detection + better highlighting.
- Inline metadata supported with a safe delimiter rule:

  - Two+ spaces then `# comment`
  - Two+ spaces then `[key=value]`

This keeps it **compatible with common `tree` output**, while also providing **standardization hooks** for better editor + parser behavior.

---

### Full-scope syntax highlighting (TextMate grammar)

File: `syntaxes/ptree.tmLanguage.json`

It highlights these major components:

#### 1) Scaffold / skeleton

- `│`, `├──`, `└──`, etc.
- Scoped as “comment-like” so most themes naturally dim it.

#### 2) Directives

- `@ptree: 1.0`, `@root: ...`
- Scoped as directive keywords + values

#### 3) Root

- First root-like line (not `#`, not `@`, not a node connector)

#### 4) Directories and files

- Directories (recommended): names ending in `/`
- Files: base + extension tokenized, including multi-part extensions (`.tar.gz`)

#### 5) Inline metadata

- `[attr=value]`
- `# comment`

#### 6) Summary lines

- `12 directories, 48 files`

---

### Folding and collapse/expand (tree-aware)

File: `src/extension.ts`

The folding algorithm:

- Parses each node line with a tolerant regex supporting unicode + ASCII scaffolds
- Computes depth by counting 4-character segments
- Uses a stack to create fold ranges for any node that has children

Result: VS Code shows folding gutters next to parent nodes, and folding behaves exactly like a tree.

---

### Markdown integration

In VS Code, **registering a language id** (`ptree`) is enough for fenced code blocks:

````markdown
```ptree
my-project/
├── README.md
└── src/
    └── index.ts
```
````

This project is set up so that works automatically.

---

### Bonus: copy path commands

This repo includes two commands (useful in docs workflows):

- **ptree: Copy Full Path at Cursor**
- **ptree: Copy Relative Path at Cursor**

They infer the path by scanning upwards and reconstructing ancestry from depth.

This is implemented in `src/extension.ts` and works even when directories do **not** end in `/` (because it uses structure, not suffixes).

---

### How to run / build locally

- (1) Unzip the project
- (2) Install dependencies and compile:

```bash
npm i
npm run compile
```

- (3) Open the folder in VS Code and press **F5** (“Run Extension”)
- (4) In the Extension Development Host:

- open `samples/example.ptree`
- confirm highlighting + folding works
- try the commands from the Command Palette

---

## If you want this to become a real “standard” (next logical steps)

This repo gives you the editor-side foundation. If you want `ptree` to become truly standardized across the ecosystem, the next big wins are:

1. **Reference generator CLI**

   - `ptree . --style unicode --dirs-suffix --attrs git,size`
   - Ensures canonical output and makes the spec “real” in practice

2. **Reference parser library**

   - Node/TS package (`@ptree/parser`)
   - Outputs a JSON AST (root, nodes, children, metadata, symlinks)

---

## ptree: 0.0.2

### Grammar Design

### USER QUERY

[1] Your extension with the cli, and the query about prefferred canononical style is BIG BONUS good work. We will require this for future injections, features, enhancements, and validation.

[2] You are correct, we must not only go with (A), but further create opinionated grammer.
[2.1] We must also change the samples, and examples.(NOTE: Please remove the specific directory names / file names, the current examples and samples are from some of my real work, and should be changed to a more relevant example and sample)

[3] THE GRAMMER AND DATA PROVIDED BELOW IS A FRAMEWORK DESIGNED TO BE SET SIMILAR AS .markdownlint.json APPLIES ITS RULES. THESE ARE DEFINITIONS, AND RULES THAT WILL BE FOLLOWED FOR THE SYNTAX HIGHLIGHTING OF THE DIRECTORY TREE. JUST AS .markdownlint.json HAS A STANDARD LINTING IT SHIPS WITH, `ptree` WILL TOO.
[3.1] DESIGN THE FRAMEWORK WITH ROBUST DEFINITIONS FOR GENERAL NAME TYPES USUALY PREFFERED IN FILE AND DIRECTORY NANING. I HAVE PROVIDED THE GENERAL SEPERATION DELEMITERS WIDELY ACCEPTED(`-`, `_` and `.` ) FOR THESE NAME TYPES.
[3.2] THESE ALL WOULD REQUIRE A CENTRAL POINT OF REFERENCE FOR THESE NAME TYPES. THIS WOULD BE THE [NAME_TYPES] SECTION, SO THE CONFIG, LINTING, AND EXAMPLES CAN ALL BE CENTRALLY MANAGED AND UPDATED FOR SYNTAX HIGHLIGHTING. **NOTE**: A GOOD FRAMEWORK TO USE AS A REFERENCE IS .markdownlint.json, AS IT IS A WELL DESIGNED AND ROBUST FRAMEWORK FOR THE MARKDOWN LINTING OF MARKDOWN FILES, AND `ptree` WILL REQUIRE A SIMILAR FRAMEWORK FOR THE CONFIG FILE AND USER CUSTOMIZATIONS.
[3.3] WE WILL DEVELOP OUR OWN OPINIONATED RULESET AS THE DEFAULT, AND PROVIDE ROBUST SUPPORT FOR USER CONFIGURATIONS AND CUSTOMIZATIONS SO THEY ARE NOT LIMITED, ASLONG AS THEY SET AND FOLLOW THE STANDARD SET IN THE CONFIG FILE.
[4] FURTHER DEVELOP THE GRAMMAR DESIGN, I HAVE PROVIDES A FRAMEWORK, I AM AWARE THERE IS SOME MISSING DATA OR PLACEHOLDERS. PLEASE FURTHER DEVELOP, AND COMPLETE THE RULINGS TO FILL IN THE MISSING DATA OR PLACEHOLDERS AND ADD THE RELEVANT EXAMPLES, SAMPLES, AND CONTEXTUAL INFORMATION. ADHERE TO THE FORMAT AND STRUCTURE OF THE FRAMEWORK PROVIDED.
[4.1] FINISH THE GRAMMER DESIGN, I HAVE PROVIDES A FRAMEWORK, I AM AWARE THERE IS SOME MISSING DATA OR PLACEHOLDERS. PLEASE FURTHER DEVELOP, AND COMPLETE THE RULINGS TO FILL IN THE MISSING DATA OR PLACEHOLDERS AND ADD THE RELEVANT EXAMPLES, SAMPLES, AND CONTEXTUAL INFORMATION. ADHERE TO THE FORMAT AND STRUCTURE OF THE FRAMEWORK PROVIDED.

### DIRECTORY TREE TRANSLATION

#### OLD `ptree` SPEC

```ptree
@ptree: 1.0
@style: unicode
@root: 0.0.3/

0.0.3/
├── analysis.md
├── DATA_DESCRIPTION.md
├── DATA_DICTIONARY.md
├── directory_tree.md
├── earth_baseline_reference.json
├── forrestall_parameter_definitions.json
├── nasa_exoplanet_archive_forrestall.csv
├── query.md
└── theory/
    ├── I. FRONT MATTER/
    │   ├── (index) - I. FRONT MATTER.md
    │   ├── Abstract.md
    │   ├── Keywords and Classifications.md
    │   └── Title Page.md
    ├── II. INTRODUCTION/
    │   ├── (index) - II. INTRODUCTION.md
    │   ├── Historical Context - Drake to Present.md
    │   ├── Paper Overview and Contributions.md
    │   ├── The Communication Paradox.md
    │   ├── The Forrestall Equation.md
    │   └── The Sensory Bias Problem.md
    ├── III. THEORETICAL FOUNDATION/
    │   ├── (index) - III. THEORETICAL FOUNDATION.md
    │   ├── Evolutionary Probability Spaces.md
    │   ├── Mathematical Framework Introduction.md
    │   ├── Sensory Architecture as Communication Filter.md
    │   └── The Decoupling Principle.md
    ├── IV. THE FORRESTALL EQUATION/
    │   ├── (index) - IV. THE FORRESTALL EQUATION.md
    │   ├── Beta - Biological Variables.md
    │   ├── Core Equation Derivation.md
    │   ├── Kappa - Cognitive Variables.md
    │   ├── Lambda - Cosmic Variables.md
    │   ├── Pi - Planetary Variables.md
    │   ├── Probability Calculations.md
    │   ├── Sigma - Sensory Variables.md
    │   ├── Variable Categories Overview.md
    │   └── Worked Examples.md
    ├── V. COMPARATIVE ANALYSIS/
    │   ├── (index) - V. COMPARATIVE ANALYSIS.md
    │   ├── Forrestall vs Drake Equation.md
    │   ├── Forrestall vs Seager Equation.md
    │   └── Integration Possibilities.md
    ├── VI. APPLICATIONS/
    │   ├── (index) - VI. APPLICATIONS.md
    │   ├── Alternative Communication Modalities.md
    │   ├── James Webb Data Integration.md
    │   ├── SETI Strategy Modifications.md
    │   └── Target Selection Criteria.md
    ├── VIII. DISCUSSION/
    │   ├── (index) - VIII. DISCUSSION.md
    │   ├── Implications for Fermi Paradox.md
    │   ├── Limitations and Assumptions.md
    │   └── Philosophical Considerations.md
    └── IX. CONCLUSION/
        ├── (index) - IX. CONCLUSION.md
        └── Synthesis and Final Thoughts.md
```

### NEW `ptree` SPEC

```ptree
@ptree: 1.0
@style: unicode
@root: 0.0.2/
@version: 0.0.2
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'Cap-Type',
    FILE: 'smol-type',
    EXT: 'CAPITAL[NAME_TYPES]',
    META: 'CAPITAL[NAME_TYPES]//'
]
@seperation_delimiters: [
    '-',
    '_',
    '.'
]
```

```ptree
PTREE_0.0.2//
├── analysis.md
├── data_description.md
├── data_dictionary.md
├── directory_tree.md
├── earth_baseline_reference.json
├── forrestall-parameter-definitions.json
├── nasa-exoplanet-archive-forrestall.csv
├── query.md
└── Theory/
    ├── I_Front_Matter/
    │   ├── (index)-i-front-matter.md
    │   ├── abstract.md
    │   ├── keywords-and-classifications.md
    │   └── title-page.md
    ├── II_Introduction/
    │   ├── (index)_ii-introduction.md
    │   ├── historical-context-drake-to-present.md
    │   ├── paper-overview-and-contributions.md
    │   ├── the-communication-paradox.md
    │   ├── the-forrestall-equation.md
    │   └── the-sensory-bias-problem.md
    ├── III_Theoretical_Foundation/
    │   ├── (index)_iii-theoretical-foundation.md
    │   ├── evolutionary-probability-spaces.md
    │   ├── mathematical-framework-introduction.md
    │   ├── sensory-architecture-as-communication-filter.md
    │   └── the-decoupling-principle.md
    ├── IV_The_Forrestall_Equation/
    │   ├── (index)_iv-the-forrestall-equation.md
    │   ├── beta-biological-variables.md
    │   ├── core-equation-derivation.md
    │   ├── kappa-cognitive-variables.md
    │   ├── lambda-cosmic-variables.md
    │   ├── pi-planetary-variables.md
    │   ├── probability-calculations.md
    │   ├── sigma-sensory-variables.md
    │   ├── variable-categories-overview.md
    │   └── worked-examples.md
    ├── V_Comparative_Analysis/
    │   ├── (index)_v-comparative-analysis.md
    │   ├── forrestall-vs-drake-equation.md
    │   ├── forrestall-vs-seager-equation.md
    │   └── integration-possibilities.md
    ├── VI_Applications/
    │   ├── (index)_vi-applications.md
    │   ├── alternative-communication-modalities.md
    │   ├── james-webb-data-integration.md
    │   ├── seti-strategy-modifications.md
    │   └── target-selection-criteria.md
    ├── VIII_Discussion/
    │   ├── (index)_viii-discussion.md
    │   ├── implications-for-fermi-paradox.md
    │   ├── limitations-and-assumptions.md
    │   └── philosophical-considerations.md
    └── IX_Conclusion/
        ├── (index)_ix-conclusion.md
        └── synthesis-and-final-thoughts.md
```

---

## GRAMMAR: 0.0.2

### DISCLAIMER
<!-- BELEW IS THE FOUNDATIONS OF THE FRAMEWORK THAT REQUIRES FURTHER CONSISTENCY AND DEFINITIONS. -->

### DICTIONARY

#### [NAME_TYPE]

- Classification rules for naming the [ROOT], [DIR], [FILE], and [META] sections.

#### [SEPERATION_DELIMITERS]

Seperation delimiters are characters used to seperate the [NAME_TYPE] and [NUMBER].

- Examples:
  1. `-`: Used Conditionally
  2. `_`: Used Conditionally
  3. `.`: Restricted to: [NAME_TYPE]:[NUMBER]

#### UNIVERSAL RULES

##### [UniRule_1]

[NAME_TYPE] [SEPERATION_DELIMITERS] MUST NEVER HAVE IDENTICAL [SEPERATION_DELIMETERS]GON THE SAME LINE.

> EXAMPLES:
---
[E01] INCORRECT:
> [SCREAM_TYPE]_[NUMBER]
OUTPUT: 'NAME_TYPE_1.0.0'

CORRECT:
> [SCREAM_TYPE]-[NUMBER]
OUTPUT: 'NAME_TYPE-1.0.0'

---
[E02]
INCORRECT:
> [Cap-Type]-[NUMBER]
OUTPUT: 'Cap-Type-1.0.0'

CORRECT:
> [Cap-Type]_[NUMBER]
OUTPUT: 'Cap-Type_1.0.0'

---
[E03]
INCORRECT:
> [snake_type]_[NUMBER]
OUTPUT: 'name_type_1.0.0'

CORRECT:
> [snake_type]-[NUMBER]
OUTPUT: 'name_type-1.0.0'

---
[E04]
INCORRECT: "none"
>
> - [CamelType] Accepts both `-` and `_` delimeters.

CORRECT:
>[CamelType]-[NUMBER]
OUTPUT: 'CamelType-1.0.0'
> [CamelType]_[NUMBER]
OUTPUT: 'CamelType_1.0.0'

---
[E05]
INCORRECT:
> [smol-type]-[NUMBER]
OUTPUT: 'smol-type-1.0.0'

CORRECT:
> [smol-type]_[NUMBER]
OUTPUT: 'smol-type_1.0.0'

---

#### [NAME_TYPE] DEFINITIONS

[SCREAM_TYPE]: `CAPITAL_LETTERS`
  EXAMPLE: `NAME_TYPE-1.0.0`
[High_Type]:
  SEPERATION_DELIMITER: `_`
  EXAMPLE: `High_Type_Name`
  WITH_NUMBER: `High_Type_Name_1.0.0`
[Cap-Type]:
  SEPERATION_DELIMITER: `-`
  EXAMPLE:`Cap-Type-Name`
  WITH_NUMBER: `Cap-Type-Name_1.0.0`
[CamelType]:
  SEPERATION_DELIMITERS: None
  EXAMPLE: `CamelTypeName`
  WITH_NUMBER: `CamelTypeName_1.0.0`
[smol-type]:
  SEPERATION_DELIMITER: `_`
  EXAMPLE: `smole-type-name`
  WITH_NUMBER: `smole-type-name_1.0.0`
[snake_type]:
  SEPERATION_DELIMITER: `_`
  EXAMPLE: `snake_type_name`
  WITH_NUMBER: `snake_type_name-1.0.0`

---:

[TODO SECTION OF DOCS]

TODO: `ptree_rules`, `ptree_default_config`, `ptree_definitions`

NOTE: SOME DATA HAS BEEN FILLED AS PALCEHOLDERS, THE DATA BELOW IS NOT COMPLETE OR UP TO DATE, BUT IT IS A START TO ORGANIZING THE RULESET THAT `ptree` HAS TO FOLLOW, CONFIGURE, AND CUSTOMIZE.

---:

### [ptree_default_config] - 0.0.1: Default `ptree` configuration ruleset, structured for future expansion

#### [ROOT] DIRECTORY

[ROOT-A]: Root Directory must indicate itself with the end delimeter of `//`
[ROOT-B]: Root Directory classification should follow the following format: `[NUMBER].[NUMBER].[NUMBER]/`
[ROOT-C]: Classification may be expanded with `_` and the [ROOT-D]format.
[ROOT-D]: Classification must follow [SCREAM_TYPE] utilizing `_` delimiter.

#### [DIR] DIRECTORIES

[DIR-A]: Directories should indicate themselves with the end delimeter of `/`
[DIR-B]: Directory classification should follow the following format (prefered) : `[Cap-Type]_[NUMBER]/`
[DIR-C]: Directory titles should be a descriptive title of the directory, and should be a single line.

#### [FILE] FILES

[FILE-A]: Files should indicate themselves with the end delimeter of `.ext`
[FILE-B]: File classification should follow the following format (prefered) : `[CAPITAL][NAME_TYPES][NUMBER].ext`
[FILE-C]: File titles should be a descriptive title of the file, and should be a single line.

#### [META] METADATA

[META-A]: Metadata should indicate themselves with the prefix delimeter `@`
[META-B]: Metadata classification should follow the snake case format: `@[snake_case]`
[META-C]: Metadata titles are used as an alternative, in line configuration setting.

<!-- REVIEW MY CONVERSATIONS, AND MY VERY RUDIMENTARY DRAFT BUILD. THE DRAFT BUILD IS ONLY INCLUDED FOR CONTEXT AND UNDERSTANDING OF MY REQUIREMENTS AND SCOPE. YOU ARE TO CREATE A FULL SCOPE, MODERN SOLUTION FOR THE `ptree` DIRECTORY TREE EXTENSION. THIS REQUIRES FULL SCOPE DESIGN WORK, FULL SCOPE GRAMMER, AND FULL SCOPE DOCUMENTATION -->

## Directory Tree Niche Identification

### Background

- While searching for a solution to a problem, the user identified a critical niche in the development world.
- This niche was a lack of a standardized format for directory trees.
- This lack of a standardized format was causing confusion and frustration among developers.
- The user was able to identify this niche because they had a problem that needed to be solved.
- The users solution is to develop a standardized format for directory trees to fill the current niche.

The following document is a list of the user's findings, in real time during a development session.

---

I see a niche here. Even if this is a quality of life feature, or a redundant styling feature, it still may provide some practical applications.

#### Examles

##### As a self sustaining file extension `.ptree`

(1) syntax highlighting may not be as important for a directory tree representation, than in functioning code.

(1.1) Seeing a structured output without syntax highlighting can blend the text together when analyzed visually by human eyes.

(1.2) Colors alone can exponentially increase visual identification, optimizing user understanding, error identification abilities in the organization.

(1.3) These visual seperations via color ultimately leading to a more organized codebase.

##### Adopted into markdown code blocks

The purpose of markdown code blocks syntax highlighting can be viewed in more than just one practical aspect. It improves the markdown in many ways, organization, practicality, and visual styling. Directory trees are used almost unilaterally in development documentation, yet there is almost no widely accepted format to support it.

I aim to change that with `ptree`(pretty tree)

---

### The Framework

What would i require to create a standard for a directory tree extension `.ptree` with the features we discussed:

- The ability to collapse/expand sections in your editor.
- Full Scope Directory Syntax Highlighting
- Markdown Itegration

### The Standard

#### EXAMPLE DIRECTORY TREE: `FULL SCOPE`

> The standard output would utilize the characters, format, and design as follows:

```ptree
### NEW `ptree` SPEC

```ptree
@ptree: '.ptree'
@style: unicode
@root: 0.0.2//
@version: 0.0.2
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'Cap-Type',
    FILE: 'smol-type',
    EXT: 'CAPITAL[NAME_TYPES]',
    META: 'CAPITAL[NAME_TYPES]//'
]
@seperation_delimiters: [
    '-',
    '_',
    '.'
]
```

```ptree
PTREE_0.0.2//
├── analysis.md
├── data_description.md
├── data_dictionary.md
├── directory_tree.md
├── earth_baseline_reference.json
├── forrestall-parameter-definitions.json
├── nasa-exoplanet-archive-forrestall.csv
├── query.md
└── Theory/
    ├── I_Front_Matter/
    │   ├── (index)-i-front-matter.md
    │   ├── abstract.md
    │   ├── keywords-and-classifications.md
    │   └── title-page.md
    ├── II_Introduction/
    │   ├── (index)_ii-introduction.md
    │   ├── historical-context-drake-to-present.md
    │   ├── paper-overview-and-contributions.md
    │   ├── the-communication-paradox.md
    │   ├── the-forrestall-equation.md
    │   └── the-sensory-bias-problem.md
    ├── III_Theoretical_Foundation/
    │   ├── (index)_iii-theoretical-foundation.md
    │   ├── evolutionary-probability-spaces.md
    │   ├── mathematical-framework-introduction.md
    │   ├── sensory-architecture-as-communication-filter.md
    │   └── the-decoupling-principle.md
    ├── IV_The_Forrestall_Equation/
    │   ├── (index)_iv-the-forrestall-equation.md
    │   ├── beta-biological-variables.md
    │   ├── core-equation-derivation.md
    │   ├── kappa-cognitive-variables.md
    │   ├── lambda-cosmic-variables.md
    │   ├── pi-planetary-variables.md
    │   ├── probability-calculations.md
    │   ├── sigma-sensory-variables.md
    │   ├── variable-categories-overview.md
    │   └── worked-examples.md
    ├── V_Comparative_Analysis/
    │   ├── (index)_v-comparative-analysis.md
    │   ├── forrestall-vs-drake-equation.md
    │   ├── forrestall-vs-seager-equation.md
    │   └── integration-possibilities.md
    ├── VI_Applications/
    │   ├── (index)_vi-applications.md
    │   ├── alternative-communication-modalities.md
    │   ├── james-webb-data-integration.md
    │   ├── seti-strategy-modifications.md
    │   └── target-selection-criteria.md
    ├── VIII_Discussion/
    │   ├── (index)_viii-discussion.md
    │   ├── implications-for-fermi-paradox.md
    │   ├── limitations-and-assumptions.md
    │   └── philosophical-considerations.md
    └── IX_Conclusion/
        ├── (index)_ix-conclusion.md
        └── synthesis-and-final-thoughts.md
```

---

### ptree Specification: 0.0.2

To achieve your three goals (Folding, Highlighting, Markdown Integration), we need to define the **Grammar** and the **Language Configuration**.

#### 1. The Anatomy of `.ptree`

We need to define the rules so the parser knows what is what.

- **Tree Characters (The Skeleton):** `│`, `├──`, `└──`, `─`, and standard spaces.
- **Nodes (The Data):**
- **Root:** The top-level directory (e.g., `0.0.3/`).
- **Directories:** Lines that contain children or end in `/`.
- **Files:** Terminal nodes, usually containing extensions (e.g., `.md`, `.json`).

- **Metadata:** Optional file sizes or comments (often seen in advanced tree outputs).

### 2. Technical Implementation Roadmap

#### A. The Coloring (TextMate Grammar)

We cannot rely on simple keywords. We need **Regular Expressions** to tokenize the line.

**The Scopes:**
We need to map parts of your text to standard TextMate scopes so current color themes work automatically.

1. **`punctuation.definition.tree`**: For the symbols `├──`, `│`, `└──`.
  _Effect:_ Usually dark grey or muted color (comment color).
2. **`entity.name.folder`**: For `theory`, `0.0.3/`, `I. FRONT MATTER`.
  _Effect:_ Bold or Blue (depending on theme).
3. **`entity.name.filename`**: For `analysis.md`.
  _Effect:_ Standard text color.
4. **`support.type.property-name`** (Optional): For the file extension itself (`.md`, `.json`).
  _Effect:_ Distinct color (e.g., Orange/Yellow) to aid visual scanning.

**Regex Logic:**

- **Tree Structure:** `^[\s│├└─]+`
- **Extension Highlighting:** `(\.)([a-zA-Z0-9]+)$`

#### B. The Folding (Language Configuration)

This is the "Quality of Life" feature.
Standard text files don't fold. To make `.ptree` collapsible, we must tell the editor that this language uses **Indentation Based Folding**.

- The editor looks at the whitespace/tree-structure at the start of the line.
- If Line B has more "tree characters" than Line A, Line B is a child of Line A.

#### C. Markdown Integration (Grammar Injection)

This is the "Adoption" feature.
We don't just want `.ptree` files; we want:

````markdown
```ptree
Root/
└── file.txt
```
````

To do this, the extension must contribute a `grammars` injection point that targets `text.html.markdown` and claims the content inside `ptree` code blocks.

---

### 3. The Prototype Code (VS Code Extension)

If you were to build this today, your `package.json` and grammar files would look like this.

#### `language-configuration.json` (Enables Folding)

```json
{
  "comments": {
    "lineComment": "#"
  },
  "brackets": [],
  "autoClosingPairs": [],
  "surroundingPairs": [],
  "folding": {
    "offSide": true,
    "markers": {
      "start": "^\\s*[│├└]", 
      "end": "^\\s*$"
    }
  }
}

```

_Note: We might need a custom "indentation" strategy, but `offSide` often handles whitespace hierarchies well._

#### `syntaxes/ptree.tmLanguage.json` (Enables Highlighting)

This is the core logic.

```json
{
  "scopeName": "source.ptree",
  "patterns": [
    {
      "comment": "The tree branches",
      "match": "([│├──└──\\s]+)",
      "name": "comment.line.character.tree"
    },
    {
      "comment": "File Extensions (Visual Separation)",
      "match": "(\\.)([a-zA-Z0-9]+)$",
      "captures": {
        "1": { "name": "punctuation.separator.extension" },
        "2": { "name": "keyword.control.extension" }
      }
    },
    {
      "comment": "Folders (ending in / or appearing as parents)",
      "match": "([a-zA-Z0-9 _\\-\\.]+\\/)",
      "name": "entity.name.section.group-title.folder"
    }
  ]
}

```

---

### 4. Visualizing the UX Upgrade

**Current State (Text):**
Everything is white/grey. You have to read the text to differentiate `analysis.md` (file) from `theory` (folder).

**The `.ptree` State:**

1. **Tree Lines (`│ ├──`):** Dimmed (Grey), pushing them to the background so the data pops.
2. **Folders (`theory`):** **Bold Blue**. Instantly recognizable as containers.
3. **Files (`analysis.md`):** White text.
4. **Extensions (`.md`):** Orange.
5. **Gutter:** Little arrows appear next to "theory" allowing you to click and **collapse** the entire `I. FRONT MATTER` section.

## ptree: 0.0.3

[Download the updated `ptree` VS Code extension + CLI toolkit](sandbox:/mnt/data/ptree-vscode-extension_updated.zip)

### What I changed (aligned to your requirements)

#### 1) Opinionated grammar + “markdownlint-style” framework

- Added a **default ruleset** + **central `[NAME_TYPES]` registry** (like `.markdownlint.json` ships defaults).
- Rules + name-type definitions live in a **single source of truth**:

  - `config/ptree.default-config.json`  ✅ (central reference)
  - `config/ptreeconfig.schema.json` ✅ (schema for IntelliSense/validation)

#### 2) Modern validation pipeline (for future injections/features)

- Added **document validation** in the VS Code extension (Diagnostics: errors/warnings on the actual `.ptree` file).
- Added a **CLI** with:

  - `ptree gen` (generate a tree)
  - `ptree validate` (validate a `.ptree` file against the default or repo config)

#### 3) Sanitized samples

- Replaced the prior sample content (your real work) with a **generic, relevant project tree**:

  - `samples/example.ptree` ✅

---

### `ptree` GRAMMAR DRAFT - 0.0.3

#### DISCLAIMER: 0.0.3

This document defines the **opinionated, default grammar + ruleset** that `ptree` ships with.

- The **format** of a `ptree` document is specified in `docs/SPEC.md`.
- This document specifies the **naming grammar** and the **default lint rules**.
- Like `.markdownlint.json`, `ptree` provides:
  - a strict, useful default ruleset
  - a config file that users can override per repo/workspace
  - centrally managed definitions (especially `[NAME_TYPES]`) so highlighting, validation, and samples stay consistent

> Note on spelling: the original framework uses `[SEPERATION_DELIMITERS]`. This draft keeps that key for compatibility, but tools MAY also accept the corrected spelling `SEPARATION_DELIMITERS`.

---

### DICTIONARY: 0.0.3

#### [NAME_TYPES](0.0.3)

A **central registry** of naming styles used to classify names for:

- **[ROOT]** labels
- **[DIR]** directory nodes
- **[FILE]** file nodes (base name, without extension)
- **[META]** meta nodes (names ending in `//`) and directive lines

Each name type defines:

- a **pattern** (regex) for matching a _bare_ name  
  (no extension, no trailing `/`, no trailing `//`)
- a **WORD_DELIMITER** used _inside_ the name (`-`, `_`, `.`, or none)
- allowed **VERSION_DELIMITERS** used to append a version number (`-` or `_`)

This registry is the _central point of reference_ for config, linting, and examples.

#### [SEPERATION_DELIMITERS](0.0.3)

Seperation delimiters are characters used to separate:

- **words** inside a name (e.g. `data-dictionary`)
- a **name** from an appended **version** (e.g. `PTREE-0.0.3`)

Default delimiter set:

- `-` (hyphen)
- `_` (underscore)
- `.` (dot — restricted; see rules)

#### [NUMBER](0.0.3)

A numeric token. In `ptree`, the primary number format is **[SEMVER]**.

#### [SEMVER](0.0.3)

A semantic-version-like string:

- `MAJOR.MINOR.PATCH`
- optionally: `-prerelease`
- optionally: `+build`

Examples:

- `1.0.0`
- `0.2.3-alpha.1`
- `2.1.0+build.20251217`

#### [WORD_DELIMITER](0.0.3)

The delimiter used **inside** a `[NAME_TYPE]` to separate words, e.g.:

- `SCREAM_TYPE`: `_`
- `smol-type`: `-`

#### [VERSION_DELIMITER](0.0.3)

The delimiter used to append a version to a name, e.g.:

- `PTREE-0.0.3`
- `User-Guide_0.0.3`

---

### UNIVERSAL RULES: 0.0.3

#### [UniRule_1](0.0.3)

[NAME_TYPE] and [VERSION_DELIMITER] MUST NEVER use the same delimiter character **when the NAME_TYPE has a WORD_DELIMITER**.

- If the NAME_TYPE uses `_` inside the name, the version delimiter MUST be `-`.
- If the NAME_TYPE uses `-` inside the name, the version delimiter MUST be `_`.
- If the NAME_TYPE has no WORD_DELIMITER (e.g. `CamelType`), both `-` and `_` are allowed.

**Why:** this prevents ambiguous scanning like `NAME_TYPE_1.0.0` where `_` is doing double-duty.

> EXAMPLES:

---
[E01] SCREAM_TYPE

INCORRECT:

- `[SCREAM_TYPE]_[SEMVER]`
- output: `API_CLIENT_0.0.3`

CORRECT:

- `[SCREAM_TYPE]-[SEMVER]`
- output: `API_CLIENT-0.0.3`

---
[E02] Cap-Type

INCORRECT:

- `[Cap-Type]-[SEMVER]`
- output: `User-Guide-0.0.3`

CORRECT:

- `[Cap-Type]_[SEMVER]`
- output: `User-Guide_0.0.3`

---
[E03] snake_type

INCORRECT:

- `[snake_type]_[SEMVER]`
- output: `user_guide_0.0.3`

CORRECT:

- `[snake_type]-[SEMVER]`
- output: `user_guide-0.0.3`

---
[E04] CamelType

CORRECT (both allowed):

- `[CamelType]-[SEMVER]` → `BuildTools-0.0.3`
- `[CamelType]_[SEMVER]` → `BuildTools_0.0.3`

---
[E05] smol-type

INCORRECT:

- `[smol-type]-[SEMVER]` → `data-dictionary-0.0.3`

CORRECT:

- `[smol-type]_[SEMVER]` → `data-dictionary_0.0.3`

---

#### [UniRule_2]

[DIR] nodes MUST end with `/`.

This is the opinionated choice `(A)`:

- makes directories unambiguous for humans and tools
- enables accurate syntax highlighting without multi-line inference
-eneables stable parsing and validation

---

#### [UniRule_3](0.0.3)

[ROOT] label MUST end with `//` in the **default ruleset**.

This makes the root label visually distinct from real filesystem directories (which end with `/`).

Example:

- `PTREE-0.0.3//`

---

#### [UniRule_4](0.0.3)

Node names MUST NOT contain spaces in the default ruleset.

Use:

- `-` for readability in lowercase names (`smol-type`)
- `_` for readability in TitleCase names (`High_Type`)

---

#### [UniRule_5](0.0.3)

[NAME_TYPE] MUST NOT mix `-` and `_` in a single bare name.

Examples:

- ✅ `data-dictionary`
- ✅ `data_dictionary`
- ❌ `data_dictionary-file`

---

#### [UniRule_6](0.0.3)

`.` is reserved for:

1. [SEMVER] internal dots (`0.0.3`)
2. file extension separators (`readme.md`)
3. _explicitly allowed_ dotted name types (e.g. `dot.smol-type`)

If dotted base names are not desired, disable dotted NAME_TYPES and/or enable stricter rules.

---

### [NAME_TYPES](0.0.3) DEFINITIONS

Below are the default naming types. The authoritative registry is shipped in:

- `config/ptree.default-config.json` → `NAME_TYPES`

Each definition includes:

- WORD_DELIMITER
- ALLOWED_VERSION_DELIMITERS (version delimiter options)
- REGEX for the bare name
- canonical examples

#### [SCREAM_TYPE](0.0.3)

- DESCRIPTION: `SCREAMING_SNAKE_CASE`
- WORD_DELIMITER: `_`
- ALLOWED_VERSION_DELIMITERS: `-`
- REGEX: `^[A-Z0-9]+(?:_[A-Z0-9]+)*$`

EXAMPLES:

- `PTREE`
- `API_CLIENT`
- `MY_TOOL`

WITH_NUMBER:

- `PTREE-0.0.3`
- `API_CLIENT-0.0.3`

---

#### [High_Type](0.0.3)

- DESCRIPTION: `Pascal_Snake_Case`
- WORD_DELIMITER: `_`
- ALLOWED_VERSION_DELIMITERS: `-`
- REGEX: `^[A-Z][A-Za-z0-9]*(?:_[A-Z][A-Za-z0-9]*)*$`

EXAMPLES:

- `Front_Matter`
- `User_Guide`
- `I_Introduction`

WITH_NUMBER:

- `User_Guide-0.0.3`
- `I_Introduction-0.0.3`

---

#### [Cap-Type](0.0.3)

- DESCRIPTION: `Title-Kebab-Case`
- WORD_DELIMITER: `-`
- ALLOWED_VERSION_DELIMITERS: `_`
- REGEX: `^[A-Z][A-Za-z0-9]*(?:-[A-Z][A-Za-z0-9]*)*$`

EXAMPLES:

- `User-Guide`
- `Api-Docs`
- `Project-Notes`

WITH_NUMBER:

- `User-Guide_0.0.3`
- `Api-Docs_0.0.3`

---

#### [CamelType](0.0.3)

- DESCRIPTION: `PascalCase`
- WORD_DELIMITER: none
- ALLOWED_VERSION_DELIMITERS: `-`, `_`
- REGEX: `^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$`

EXAMPLES:

- `BuildTools`
- `PtreeConfig`

WITH_NUMBER:

- `BuildTools-0.0.3`
- `BuildTools_0.0.3`

---

#### [smol-type](0.0.3)

- DESCRIPTION: `kebab-case`
- WORD_DELIMITER: `-`
- ALLOWED_VERSION_DELIMITERS: `_`
- REGEX: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

EXAMPLES:

- `readme`
- `data-dictionary`
- `tree-parser`

WITH_NUMBER:

- `data-dictionary_0.0.3`

---

#### [snake_type](0.0.3)

- DESCRIPTION: `snake_case`
- WORD_DELIMITER: `_`
- ALLOWED_VERSION_DELIMITERS: `-`
- REGEX: `^[a-z0-9]+(?:_[a-z0-9]+)*$`

EXAMPLES:

- `data_dictionary`
- `tree_parser`

WITH_NUMBER:

- `data_dictionary-0.0.3`

---

### Default registry additions

These are included by default for real-world compatibility:

- `[dotfile]`: `.gitignore`, `.env`, `.editorconfig`
- `[dotdir]`: `.github`, `.vscode`
- `[dot.smol-type]`: `tsconfig.base`, `vite.config`

---

## [ptree_default_config] - 0.0.2

The default configuration is shipped as:

- `config/ptree.default-config.json`

It is intended to be copied and customized (like `.markdownlint.json`).

### [ROOT](0.0.3) DIRECTORY

[ROOT-A]: Root label MUST end with `//`.

[ROOT-B]: Root label MUST follow this format:

- `[SCREAM_TYPE]-[SEMVER]//`

[ROOT-C]: If the `@root:` directive is present, it MUST end with `/` and represents the **real filesystem root path** used for resolving/copying paths.

Example:

```ptree
@ptree: 1.0
@style: unicode
@root: ./

PTREE-0.0.2//
```

### [DIR](0.0.3)

[DIR-A]: Directories MUST end with `/`.

[DIR-B]: Directory names SHOULD match one of the allowed DIR name types.

Default allowed DIR NAME_TYPES:

- `[Cap-Type]` (default preference)
- `[High_Type]` (allowed; useful for numbered/sectioned docs)
- `[CamelType]` (allowed)
- `[dotdir]` (allowed)

[DIR-C]: Directory titles MUST be single-line.

### [FILE](0.0.3)

[FILE-A]: Files MAY have an extension. (Some files intentionally do not, e.g. `LICENSE`.)

[FILE-B]: File base names SHOULD match one of the allowed FILE name types.

Default allowed FILE NAME_TYPES:

- `[smol-type]` (default preference)
- `[snake_type]` (allowed)
- `[dotfile]` (allowed)
- `[dot.smol-type]` (allowed)
- `[CamelType]` (allowed)

[FILE-C]: File titles MUST be single-line.

### [EXT](0.0.3)

[EXT-A]: Extensions MUST be composed of ASCII letters/digits and MAY include `_` or `-`.

[EXT-B]: Extensions SHOULD be lowercase by default.

Examples:

- `.md`
- `.json`
- `.tar.gz`

### [META](0.0.3)

[META-A]: Metadata nodes MAY be represented as names ending with `//`.

[META-B]: Directive lines (starting with `@`) are treated as metadata.

[META-C]: Metadata titles MUST be single-line.

---

## [ptree_rules] - Default Rule IDs

The default rules are shipped in `config/ptree.default-config.json` under `RULES`.

A rule is referenced by an ID like `PT006` and has:

- `enabled: true|false`
- `severity: "error"|"warning"|"info"`
- optional rule-specific configuration

Example (markdownlint-style):

```json
{
  "RULES": {
    "default": true,
    "PT006": true,
    "PT009": { "enabled": false }
  }
}
```

---

## [ptree_config_files]

Like markdownlint, `ptree` looks for a config file in the workspace.

Recommended file names (first match wins):

- `.ptreerc.json`
- `.ptree.json`
- `ptree.config.json`

The default config used when no file is present is:

- `config/ptree.default-config.json`

---

## Where the central `[NAME_TYPES]` lives (the “source of truth”)

**File:** `config/ptree.default-config.json`

Key sections:

- `NAME_TYPES` ✅ (central registry)
- `ENTITY_NAME_TYPES` ✅ (maps ROOT/DIR/FILE/META → allowed name types)
- `RULES` ✅ (markdownlint-style rule switches + severity)

Also included:

- `config/ptreeconfig.schema.json` so VS Code can validate your config files via the extension’s `jsonValidation` contribution.

---

## Updated sanitized sample

**File:** `samples/example.ptree`

```ptree
@ptree: 1.0
@style: unicode
@root: ./
@config: default

PTREE-0.0.2//
├── readme.md
├── changelog.md
├── ptree.config.json
├── Docs/
│   ├── specification.md
│   └── grammar.md
├── Src/
│   ├── index.ts
│   ├── tree-parser.ts
│   └── name-types.ts
└── Tests/
    ├── parser.test.ts
    └── Fixtures/
        └── sample-tree.ptree
````

---

## CLI usage (included)

After install + build:

```bash
npm install
npm run compile
```

Generate a tree:

```bash
node bin/ptree.js gen . --style unicode --max-depth 4
```

Validate a `.ptree` file:

```bash
node bin/ptree.js validate samples/example.ptree
```

---

## VS Code behavior now

- **Syntax highlighting**: updated `syntaxes/ptree.tmLanguage.json` to understand:

  - root labels ending in `//`
  - directives (`@ptree: ...`)
  - meta markers `//`
  - semver highlighting
- **Folding**: still indentation/tree-aware
- **Validation**:

  - automatic diagnostics on open/edit/save
  - command: **“ptree: Validate Document”**
- **Config file support**:

  - `.ptreerc.json`, `.ptree.json`, `ptree.config.json`
  - schema-backed JSON IntelliSense

---

## ptree: 0.0.4

Done — I advanced the implementation to a **canonical “spec” mode** that matches your canon header/settings, and wired it through:

- **Per-file profile auto-selection** (`@ptree: spec` ⇒ canonical rules)
- **Multi-line directive blocks** (`@name_type:[ ... ]`, `@seperation_delimiters: [ ... ]`)
- **Opinionated canonical rules** (ROOT/DIR/FILE enforced exactly as you set)
- **CLI support** (`--profile spec`, `--version`, plus `--fix`)
- **VS Code command** to apply safe mechanical fixes

[Download the updated VS Code extension + CLI (zip)](sandbox:/mnt/data/ptree-vscode-extension_canon.zip)

---

### 1) Canon profile selection (automatic)

If a `.ptree` document contains:

```ptree
@ptree: spec
```

…the extension/CLI will automatically load the shipped canonical config profile:

- `config/ptree.spec-config.json`

If it’s anything else (or missing), it uses the flexible:

- `config/ptree.default-config.json`

You can also force the profile in the CLI with `--profile spec|default`.

---

### Canon settings are now the canonical spec header

This is now treated as the canonical “spec” header and is **validated as a required block** in spec mode:

```ptree
@ptree: spec
@style: unicode
@version: 0.0.2
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]
@seperation_delimiters: [
    '-',
    '_',
    '.'
]
```

#### Canonical (spec) enforcement added

In **spec** profile, these are enforced:

- **ROOT** must be: `PTREE-<@version>//`
- **DIR** must be **High_Type**
- **FILE** must be **smol-type**
- **Delimiter set** must include `-`, `_`, `.` as declared
- **Header blocks are required** (name_type + seperation_delimiters)

---

### Important practical detail (makes FILE rules usable)

In **spec mode**, FILE naming rules apply to the **stem before the first dot**.

That means:

- `parser.test.ts` → stem = `parser` (must be `smol-type`), extension = `test.ts`
- `ptree.config.json` → stem = `ptree` (must be `smol-type`), extension = `config.json`

This is controlled by a new config knob:

- `FILE_EXTENSION_SPLIT: "firstDot"` (spec profile)
- `FILE_EXTENSION_SPLIT: "lastDot"` (default profile)

So canonical FILE rules stay strict **without banning** common real-world filenames.

---

### Updated sample (sanitized + matches your canon header)

The shipped sample was replaced with a neutral, relevant tree (no real project names):

`samples/example.ptree`:

```ptree
@ptree: spec
@style: unicode
@version: 0.0.2
@name_type:[
    ROOT: 'SCREAM_TYPE',
    DIR: 'High_Type',
    FILE: 'smol-type'
]
@seperation_delimiters: [
    '-',
    '_',
    '.'
]

PTREE-0.0.2//
├── readme.md
├── changelog.md
├── ptree.config.json
├── Docs/
│   ├── specification.md
│   └── grammar.md
├── Src/
│   ├── index.ts
│   ├── tree-parser.ts
│   └── name-types.ts
└── Tests/
    ├── parser.test.ts
    └── Fixtures/
        └── sample-tree.ptree
```

---

### CLI upgrades

#### Generate canonical header

```bash
node bin/ptree.js gen . --profile spec --version 0.0.2 --max-depth 5
```

#### Validate (auto-detects from `@ptree:`)

```bash
node bin/ptree.js validate samples/example.ptree
```

#### Fix safe mechanical issues

- `--fix` prints the fixed output
- `--fix --write` overwrites the file

```bash
node bin/ptree.js validate samples/example.ptree --fix --write
```

What the fixer does (intentionally conservative):

- Ensures spec directives exist (if spec profile is active)
- Normalizes root label to `PTREE-<@version>//` (spec mode)
- Adds trailing `/` to parent dirs that have children
- Lowercases file extensions (last segment)

It **does not** rename files/directories to force naming compliance (that would risk misrepresenting the real filesystem).

---

### VS Code: new command

Added command:

- **ptree: Apply Canonical Fixes** (`ptree.fixDocument`)

It applies the same safe mechanical fixes to the active `.ptree` editor buffer.

---

### Where this lives in the project

Key additions/changes you’ll see in the zip:

- `config/ptree.spec-config.json` (new canonical profile)
- `config/ptree.default-config.json` updated with:

  - `FILE_EXTENSION_SPLIT`
  - spec-only rule IDs present but disabled by default profile
- `src/core/parser.ts` supports **multi-line bracket directives**
- `src/core/validator.ts` includes spec-only rule checks (PT010–PT015)
- `src/core/fixer.ts` (new) shared by CLI and VS Code command
- `syntaxes/ptree.tmLanguage.json` updated to highlight directive blocks
- `samples/example.ptree` sanitized + canonical

---

### Semantic Tokens and Dynamic Highlighting

- Driven by **`NAME_TYPES`**.

> “Central `NAME_TYPES` drives highlighting” (like `.markdownlint.json` drives lint rules)

---

### What’s new in this step

#### 1) Semantic Tokens Provider (NAME_TYPES-aware)

Added a **Semantic Tokens Provider** that:

- loads the **effective config** (built-in `default` or `spec` + optional user config)
- compiles the configured `NAME_TYPES` regex registry
- classifies each:

  - **ROOT** label / path
  - **DIR** names
  - **FILE** stems (respects `FILE_EXTENSION_SPLIT`)
  - name type strings inside `@name_type:[ ... ]`
- emits semantic tokens with **name-type modifiers** like:

  - `nt_scream_type`
  - `nt_high_type`
  - `nt_smol_type`
  - etc.

…and emits a **`mismatch`** modifier when an entity name doesn’t conform to its allowed mapping.

#### 2) Works with your canon “spec” header

Because `@ptree: spec` already selects the canonical rules, the semantic highlighter will naturally track your canon settings:

```ptree
@ptree: spec
@style: unicode
@version: 0.0.2
@name_type:[
  ROOT: 'SCREAM_TYPE',
  DIR: 'High_Type',
  FILE: 'smol-type'
]
```

So your highlighting will match the _same_ rules the validator is enforcing.

#### 3) Auto-refresh when config changes

When you save one of:

- `.ptreerc.json`
- `.ptree.json`
- `ptree.config.json`

…the extension now refreshes semantic highlighting (and will rebuild its internal legend if NAME_TYPES were changed/expanded).

#### 4) Proper VS Code contributions for semantic tokens

`package.json` now contributes:

- `semanticTokenTypes`
- `semanticTokenModifiers`
- `semanticTokenScopes` (fallback mapping so themes behave sensibly)
- default enablement for ptree:

  - `"[ptree]": { "editor.semanticHighlighting.enabled": true }`

---

## 0.0.4 GUIDE

### How to customize colors (this is where it becomes “markdownlint-like”)

You can now theme by **entity type + name type modifier**.

Example selectors:

- `ptreeDir.nt_high_type`
- `ptreeFile.nt_smol_type`
- `ptreeRoot.nt_scream_type`
- `ptreeDir.mismatch` (names that violate allowed types)

Add to VS Code settings:

```json
{
  "editor.semanticTokenColorCustomizations": {
    "rules": {
      "ptreeScaffold": {},
      "ptreeDir.nt_high_type": {},
      "ptreeFile.nt_smol_type": {},
      "ptreeRoot.nt_scream_type": {},
      "ptreeDir.mismatch": {},
      "ptreeFile.mismatch": {}
    }
  }
}
```

(You can set `foreground` / `fontStyle` inside those objects to whatever you want.)

---

### Where the implementation lives

- **Semantic token engine:** `src/semanticTokens.ts`
- **Extension wiring + refresh logic:** `src/extension.ts`
- **Docs:** `docs/SEMANTIC_TOKENS.md`
- **Contributions:** `package.json` (`semanticTokenTypes`, `semanticTokenModifiers`, `semanticTokenScopes`)

---

### What the _next_ step after this should be

Now that we can _identify_ mismatches semantically, the next upgrade that completes the “modern solution” loop is:

### ✅ Code Actions / Quick Fixes

- “Rename to match `smol-type`”
- “Rename to match `High_Type`”
- “Normalize extension casing”
- “Insert missing canonical header blocks (spec)”
- “Convert mixed delimiters to configured delimiter”

That would make ptree feel like a real language mode (lint → fix → format), not just highlighting.

If you want me to proceed, I’ll implement:

- a `CodeActionProvider` that reads the same config + NAME_TYPES registry,
- emits targeted quick-fixes for PT00x rule failures,
- and (optionally) a formatter-style “ptree: Format Document” command that applies safe canonical formatting + ordering rules.
