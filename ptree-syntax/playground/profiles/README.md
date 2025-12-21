# Profile Comparison

This folder contains example files demonstrating the difference between ptree's two validation profiles.

## Quick Comparison

| Feature | Default Profile | Spec Profile |
|---------|-----------------|--------------|
| `@ptree` directive | Optional (warning) | Required: `spec` |
| `@style` directive | Optional | Required: `unicode` |
| `@version` directive | Optional | Required: SEMVER |
| `@name_type` block | Optional | Required with canonical mapping |
| `@separation_delimiters` | Optional | Required: `['-', '_', '.']` |
| Root label format | Any valid `NAME//` | Must be `PTREE-<version>//` |
| DIR NAME_TYPEs | Multiple allowed | Only `High_Type` |
| FILE NAME_TYPEs | Multiple allowed | Only `smol-type`, `index-type` |

## Files in This Folder

- **default-profile.ptree** - Example using the flexible default profile
- **spec-profile.ptree** - Example using the strict canonical spec profile

## Validation Rules by Profile

### Default Profile (PT001-PT009)

| Rule | Enabled | Severity | Description |
|------|---------|----------|-------------|
| PT001 | ✅ | error | Root label must end with `//` |
| PT002 | ✅ | error | Parent nodes must end with `/` |
| PT003 | ✅ | warning | Require `@ptree` directive |
| PT004 | ✅ | error | Enforce NAME_TYPE by entity |
| PT005 | ✅ | error | Version delimiter rule (UniRule_1) |
| PT006 | ✅ | error | No spaces in names |
| PT007 | ✅ | warning | Extensions should be lowercase |
| PT008 | ✅ | warning | No mixing `-` and `_` (UniRule_5) |
| PT009 | ❌ | warning | Sorting (disabled by default) |

### Spec Profile (PT001-PT015)

All default rules plus:

| Rule | Enabled | Severity | Description |
|------|---------|----------|-------------|
| PT010 | ✅ | error | `@ptree` must be `spec` |
| PT011 | ✅ | error | `@style` must be `unicode` |
| PT012 | ✅ | error | `@version` must be SEMVER |
| PT013 | ✅ | error | `@name_type` block required |
| PT014 | ✅ | error | `@separation_delimiters` required |
| PT015 | ✅ | error | Root must be `PTREE-<version>//` |

## Testing Profile Differences

1. Open `default-profile.ptree` - should validate with no errors
2. Open `spec-profile.ptree` - should validate with no errors
3. Try removing the `@version` directive from `spec-profile.ptree`:
   - You'll see PT012 error: "Missing required directive: @version"
4. Try changing `@ptree: spec` to `@ptree: default` in `spec-profile.ptree`:
   - You'll see PT010 error: "@ptree must be 'spec'"

## When to Use Each Profile

### Use Default Profile When:
- Learning ptree syntax
- Quick documentation drafts
- Flexible naming conventions needed
- Migrating from other tree formats

### Use Spec Profile When:
- Publishing official documentation
- Ensuring consistency across a team
- Generating trees programmatically
- Maximum validation strictness desired
