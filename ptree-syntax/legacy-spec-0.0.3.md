# Grammar Design

## USER QUERY

- [1] Your extension with the cli, and the query about prefferred canononical style is BIG BONUS good work. We will require this for future injections, features, enhancements, and validation.
- [2] You are correct, we must not only go with (A), but further create opinionated grammer.
  - [2.1] We must also change the samples, and examples.(NOTE: Please remove the specific directory names / file names, the current examples and samples are from some of my real work, and should be changed to a more relevant example and sample)
- [3] THE GRAMMER AND DATA PROVIDED BELOW IS A FRAMEWORK DESIGNED TO BE SET SIMILAR AS .markdownlint.json APPLIES ITS RULES. THESE ARE DEFINITIONS, AND RULES THAT WILL BE FOLLOWED FOR THE SYNTAX HIGHLIGHTING OF THE DIRECTORY TREE. JUST AS .markdownlint.json HAS A STANDARD LINTING IT SHIPS WITH, `ptree` WILL TOO.
  - [3.1] DESIGN THE FRAMEWORK WITH ROBUST DEFINITIONS FOR GENERAL NAME TYPES USUALY PREFFERED IN FILE AND DIRECTORY NANING. I HAVE PROVIDED THE GENERAL SEPERATION DELEMITERS WIDELY ACCEPTED(`-`, `_` and `.` ) FOR THESE NAME TYPES.
  - [3.2] THESE ALL WOULD REQUIRE A CENTRAL POINT OF REFERENCE FOR THESE NAME TYPES. THIS WOULD BE THE [NAME_TYPES] SECTION, SO THE CONFIG, LINTING, AND EXAMPLES CAN ALL BE CENTRALLY MANAGED AND UPDATED FOR SYNTAX HIGHLIGHTING. **NOTE**: A GOOD FRAMEWORK TO USE AS A REFERENCE IS .markdownlint.json, AS IT IS A WELL DESIGNED AND ROBUST FRAMEWORK FOR THE MARKDOWN LINTING OF MARKDOWN FILES, AND `ptree` WILL REQUIRE A SIMILAR FRAMEWORK FOR THE CONFIG FILE AND USER CUSTOMIZATIONS.
  - [3.3] WE WILL DEVELOP OUR OWN OPINIONATED RULESET AS THE DEFAULT, AND PROVIDE ROBUST SUPPORT FOR USER CONFIGURATIONS AND CUSTOMIZATIONS SO THEY ARE NOT LIMITED, ASLONG AS THEY SET AND FOLLOW THE STANDARD SET IN THE CONFIG FILE.
- [4] FURTHER DEVELOP THE GRAMMAR DESIGN, I HAVE PROVIDES A FRAMEWORK, I AM AWARE THERE IS SOME MISSING DATA OR PLACEHOLDERS. PLEASE FURTHER DEVELOP, AND COMPLETE THE RULINGS TO FILL IN THE MISSING DATA OR PLACEHOLDERS AND ADD THE RELEVANT EXAMPLES, SAMPLES, AND CONTEXTUAL INFORMATION. ADHERE TO THE FORMAT AND STRUCTURE OF THE FRAMEWORK PROVIDED.
  - [4.1] FINISH THE GRAMMER DESIGN, I HAVE PROVIDES A FRAMEWORK, I AM AWARE THERE IS SOME MISSING DATA OR PLACEHOLDERS. PLEASE FURTHER DEVELOP, AND COMPLETE THE RULINGS TO FILL IN THE MISSING DATA OR PLACEHOLDERS AND ADD THE RELEVANT EXAMPLES, SAMPLES, AND CONTEXTUAL INFORMATION. ADHERE TO THE FORMAT AND STRUCTURE OF THE FRAMEWORK PROVIDED.

## DIRECTORY TREE TRANSLATION

### OLD SPEC

```
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

### NEW SPEC

> The metadata config directly sets the syntax for the directory tree below. This overrides any config set, settings the syntax highlighting and linting.
```
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
    NUMERAL: 'ROMAN_NUMERAL'
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

# `ptree` GRAMMAR DRAFT - 0.0.1

## DISCLAIMER
<!-- BELEW IS THE FOUNDATIONS OF THE FRAMEWORK THAT REQUIRES FURTHER CONSISTENCY AND DEFINITIONS. -->

## DICTIONARY

### [NAME_TYPE]
- Classification rules for naming the [ROOT], [DIR], [FILE], [EXT], and [META] sections.

### [SEPERATION_DELIMITERS]
Seperation delimiters are characters used to seperate the [NAME_TYPE] and [NUMBER].
- Examples:
  1. `-`: Used Conditionally
  2. `_`: Used Conditionally
  3. `.`: Restricted to: [NAME_TYPE]:[NUMBER]

### UNIVERSAL RULES

#### [UniRule_1]
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

### [NAME_TYPE] DEFINITIONS

[SCREAM_TYPE]: `CAPITAL_LETTERS`
  [SEPERATION_DELIMITER]: `_`
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

## [ptree_default_config] - 0.0.1: Default `ptree` configuration ruleset, structured for future expansion

### [ROOT] DIRECTORY

[ROOT-A]: Root Directory must indicate itself with the end delimeter of `//`
[ROOT-B]: Root Directory classification should follow the following format: `[NUMBER].[NUMBER].[NUMBER]/`
[ROOT-C]: Classification may be expanded with `_` and the [ROOT-D]format.
[ROOT-D]: Classification must follow [CAPITAL][NAME_TYPES][NUMBER] be expanded with `-` and the [ROOT-E]format.
Example: `1.0.0_/`

### [DIR] DIRECTORIES

[DIR-A]: Directories should indicate themselves with the end delimeter of `/`
[DIR-B]: Directory classification should follow the following format (prefered) : `[Cap-Type]_[NUMBER]/`
[DIR-C]: Directory titles should be a descriptive title of the directory, and should be a single line.

### [FILE] FILES

[FILE-A]: Files should indicate themselves with the end delimeter of `.ext`
[FILE-B]: File classification should follow the following format (prefered) : `[CAPITAL][NAME_TYPES][NUMBER].ext`
[FILE-C]: File titles should be a descriptive title of the file, and should be a single line.

### [EXT] EXTENSIONS

[EXT-A]: Extensions should indicate themselves with the end delimeter of `.ext`
[EXT-B]: Extension classification should follow the following format (prefered) : `[CAPITAL][NAME_TYPES][NUMBER].ext`
[EXT-C]: Extension titles should be a descriptive title of the extension, and should be a single line.

### [META] METADATA

[META-A]: Metadata should indicate themselves with the end delimeter of `//`
[META-B]: Metadata classification should follow the following format (prefered) : `[CAPITAL][NAME_TYPES][NUMBER]//`
[META-C]: Metadata titles should be a descriptive title of the metadata, and should be a single line.
