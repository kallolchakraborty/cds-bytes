# CDS Quick Reference

A comprehensive categorized reference for SAP CDS View development following SAP VDM best practices. All examples use the `/DMO/` flight reference scenario (Travel, Booking, Customer, Agency).

## Naming Conventions

| Prefix | Artifact | Example |
|--------|----------|---------|
| `ZPRAC_CDS_` | CDS view entity (used in ABAP/openSQL) | `ZPRAC_CDS_SIMPLE` |
| `ZPRAC_SQL_` | SQL view name (visible in SE11) | `ZPRAC_SQL_SIMPLE` |
| `ZPRAC_TF_` | CDS table function | `ZPRAC_TF_SIMPLE` |
| `ZCL_TF_` | AMDP class for a table function | `ZCL_TF_SIMPLE` |
| `ZCL_AMDP_` | AMDP class (database procedure) | `ZCL_AMDP_SIMPLE` |

### Standard Annotations Used Across All Files

```abap
@AbapCatalog.sqlViewName: 'ZPRAC_SQL_XXX'       -- SE11 SQL view name
@AbapCatalog.compiler.compareFilter: true         -- WHERE clause optimization
@AbapCatalog.preserveKey: true                    -- Preserve key fields
@AccessControl.authorizationCheck: #CHECK         -- Enable DCL access control
@EndUserText.label: '...'                         -- Description text
```

### Field-Level @Semantics Annotations

| Annotation | Usage | Purpose |
|------------|-------|---------|
| `@Semantics.amount.currencyCode: 'Field'` | Before amount fields | Links amount to currency code field |
| `@Semantics.date: true` | Before date/timestamp fields | Marks field as date type |
| `@Semantics.user.createdBy: true` | Before creator field | Marks user who created record |
| `@Semantics.user.lastChangedBy: true` | Before changer field | Marks user who last changed record |
| `@Environment.systemField: #CLIENT` | Before client field | Maps to ABAP session client |

## Complete File Reference

### 1. Basic / Foundation (5 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_SIMPLE` | `ZPRAC_CDS_SIMPLE` | `ZPRAC_SQL_SIMPLE` | Basic SELECT, @Semantics, @Environment.systemField, client handling |
| `ZPRAC_CDS_VIEW_ON_VIEW` | `ZPRAC_CDS_VIEW_ON_VIEW` | `ZPRAC_SQL_VON_V` | View layering, consuming /DMO/I_Travel_D |
| `ZPRAC_CDS_DATA_MANIP` | `ZPRAC_CDS_DATA_MANIP` | `ZPRAC_SQL_DAT_MAN` | CASE, arithmetic (+,-,*,/,DIVISION,MOD), CONCAT, SUBSTRING, LTRIM, RTRIM, REPLACE, UPPER, LOWER, CAST |
| `ZPRAC_CDS_CAST` | `ZPRAC_CDS_CAST` | `ZPRAC_SQL_CAST` | CAST to fltp, dec(10,2), int4, int8, char(n), numc(n), dats, cast with division |
| `ZPRAC_CDS_MDX_EXT` | `ZPRAC_CDS_MDX_EXT` | `ZPRAC_SQL_MDXEXT` | @Metadata.allowExtensions, ANNOTATE VIEW pattern (.asr) |

### 2. Parameter Handling (4 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_PARAM` | `ZPRAC_CDS_PARAM` | `ZPRAC_SQL_PARAM` | WITH PARAMETERS, :param in WHERE, mandatory params |
| `ZPRAC_CDS_PARAM_CONST` | `ZPRAC_CDS_PARAM_CONST` | `ZPRAC_SQL_PARAM_C` | view(param: 'constant') syntax, pre-filtered views |
| `ZPRAC_CDS_PARAM_VAR` | `ZPRAC_CDS_PARAM_VAR` | `ZPRAC_SQL_PAR_VAR` | $parameters.<param> forwarding to downstream view |
| `ZPRAC_CDS_DEFAULT_PARAM` | `ZPRAC_CDS_DEFAULT_PARAM` | `ZPRAC_SQL_DEFPAR` | DEFAULT keyword, optional params, mixed mandatory/optional |

### 3. Joins (5 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_INNER_JOIN` | `ZPRAC_CDS_INNER_JOIN` | `ZPRAC_SQL_INN_JN` | INNER JOIN with composite ON conditions (AND + OR), 3-table JOIN |
| `ZPRAC_CDS_LEFT_JOIN` | `ZPRAC_CDS_LEFT_JOIN` | `ZPRAC_SQL_LEFT_JN` | LEFT OUTER JOIN, COALESCE with JOIN, NULL indicator CASE |
| `ZPRAC_CDS_RIGHT_JOIN` | `ZPRAC_CDS_RIGHT_JOIN` | `ZPRAC_SQL_RIGHT_J` | RIGHT OUTER JOIN (mirror of LEFT), all bookings preserved |
| `ZPRAC_CDS_CROSS_JOIN` | `ZPRAC_CDS_CROSS_JOIN` | `ZPRAC_SQL_CROSS_J` | CROSS JOIN (Cartesian product), Travel × Agency |

### 4. Associations & Path Expressions (2 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_ASSOCIATION` | `ZPRAC_CDS_ASSOCIATION` | `ZPRAC_SQL_ASSOC` | Association [1] definition, lazy join, exposing _association publicly |
| `ZPRAC_CDS_PATH_EXPR` | `ZPRAC_CDS_PATH_EXPR` | `ZPRAC_SQL_PATH` | Path expression dot notation, _Assoc._Customer.FirstName, implicit JOIN |

### 5. Aggregation (2 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_GROUP_BY` | `ZPRAC_CDS_GROUP_BY` | `ZPRAC_SQL_GROUP_BY` | GROUP BY, SUM, COUNT, COUNT(DISTINCT), AVG, MIN, MAX, @Semantics on aggregated fields |
| `ZPRAC_CDS_HAVING` | `ZPRAC_CDS_HAVING` | `ZPRAC_SQL_HAVING` | HAVING clause, HAVING vs WHERE difference |

### 6. Functions (4 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_STRING_FUNC` | `ZPRAC_CDS_STRING_FUNC` | `ZPRAC_SQL_STRING` | CONCAT (2-arg, 3-arg), CONCAT_WITH_SPACE, SUBSTRING, LEFT, RIGHT, LENGTH, REPLACE, ABAP_UPPER, ABAP_LOWER, LTRIM, RTRIM, INSTR, STRPOS |
| `ZPRAC_CDS_DATE_FUNC` | `ZPRAC_CDS_DATE_FUNC` | `ZPRAC_SQL_DATE` | DATS_ADD_DAYS, DATS_ADD_MONTHS, DATS_DAYS_BETWEEN, DATS_IS_VALID, TSTMP_TO_DATS, TSTMP_TO_TIMS, ABAP_CURRENT_DATE, ABAP_CURRENT_TIME |
| `ZPRAC_CDS_COALESCE` | `ZPRAC_CDS_COALESCE` | `ZPRAC_SQL_COALESCE` | COALESCE with defaults, NULL-safe arithmetic, NULLIF, nested COALESCE, CASE with IS NULL check |
| `ZPRAC_CDS_CURR_CONV` | `ZPRAC_CDS_CURR_CONV` | `ZPRAC_SQL_CURCNV` | CURRENCY_CONVERSION, DECIMAL_SHIFT, @Semantics.amount.currencyCode |

### 7. Subqueries & Set Operations (2 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_EXISTS` | `ZPRAC_CDS_EXISTS` | `ZPRAC_SQL_EXISTS` | EXISTS correlated subquery, NOT EXISTS alternative, EXISTS vs JOIN |
| `ZPRAC_CDS_UNION` | `ZPRAC_CDS_UNION` | `ZPRAC_SQL_UNION` | UNION ALL, UNION (dedup), column compatibility, RecordType discriminator |

### 8. VDM Patterns (5 files)

| File | @VDM.viewType | SQL View | Key Topics |
|------|---------------|----------|------------|
| `ZPRAC_CDS_VDM_PRIVATE` | #PRIVATE | `ZPRAC_SQL_VDMPRI` | Internal helper, shared logic, @AccessControl.authorizationCheck: #NOT_REQUIRED |
| `ZPRAC_CDS_VDM_BASIC` | #BASIC | `ZPRAC_SQL_VDMBAS` | Interface view, @Analytics.dataCategory: #DIMENSION, full @Semantics |
| `ZPRAC_CDS_VDM_COMPOSITE` | #COMPOSITE | `ZPRAC_SQL_VDMCOM` | Business logic, calculated fields, @Analytics.dataCategory: #CUBE |
| `ZPRAC_CDS_VDM_CONSUME` | #CONSUMPTION | `ZPRAC_SQL_VDMCON` | @OData.publish: true, @OData.entitySet.name, full @Semantics |
| `ZPRAC_CDS_MDX_EXT` | — | `ZPRAC_SQL_MDXEXT` | @Metadata.allowExtensions, ANNOTATE VIEW pattern |

### 9. RAP / Composition / Extensibility (4 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_COMPOSITION` | `ZPRAC_CDS_COMPOSITION` | `ZPRAC_SQL_COMP` | composition [0..n] of, parent-child lifecycle, @ObjectModel.compositionRoot |
| `ZPRAC_CDS_OBJECT_MODEL` | `ZPRAC_CDS_OBJECT_MODEL` | `ZPRAC_SQL_OBJMOD` | @ObjectModel.representativeKey, writeDraft, foreignKey.association, text, template |
| `ZPRAC_CDS_EXTENSIBILITY` | `ZPRAC_CDS_EXTENSIBILITY` | `ZPRAC_SQL_EXT` | @Extensible: true, key user extensibility, APPEND structure pattern |
| `ZPRAC_CDS_VIEW_EXT` | `ZPRAC_CDS_VIEW_EXT` | `ZPRAC_SQL_VEXT` | @AbapCatalog.viewExtension, extend view, adding fields to existing views |

### 10. Fiori / OData Annotations (3 files)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_UI_ANNOT` | `ZPRAC_CDS_UI_ANNOT` | `ZPRAC_SQL_UI_ANN` | @UI.headerInfo, @UI.lineItem, @UI.identification, @UI.selectionField |
| `ZPRAC_CDS_VALUE_HELP` | `ZPRAC_CDS_VALUE_HELP` | `ZPRAC_SQL_VLHLP` | @Consumption.valueHelpDefinition (entity, element, additionalBinding) |
| `ZPRAC_CDS_SEARCH` | `ZPRAC_CDS_SEARCH` | `ZPRAC_SQL_SEARCH` | @Search.searchable, @Search.fuzzinessThreshold, @Search.ranking |

### 11. OData Draft / Transactional (1 file)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_ODATA_DRAFT` | `ZPRAC_CDS_ODATA_DRAFT` | `ZPRAC_SQL_ODRAF` | @OData.draft.enabled, @ObjectModel.writeDraft, @ObjectModel.createEnabled/updateEnabled/deleteEnabled |

### 12. Client Handling (1 file)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_CLIENT_HANDLING` | `ZPRAC_CDS_CLIENT_HANDLING` | `ZPRAC_SQL_CLIENT` | @ClientHandling.algorithm: #AUTOMATIC_RHS / #INHERITED / #PROTECTED / #NO_CLIENT |

### 13. Session Context (1 file)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_SESSION_VAR` | `ZPRAC_CDS_SESSION_VAR` | `ZPRAC_SQL_SESS_V` | $session.system_date, $session.user, $session.client, $session.system_language, $session.user_date, $session.user_timezone |

### 14. Hierarchy (1 file)

| File | Entity | SQL View | Key Topics |
|------|--------|----------|------------|
| `ZPRAC_CDS_HIERARCHY` | `ZPRAC_CDS_HIERARCHY` | `ZPRAC_SQL_HIER` | ParentChild association, self-join hierarchy, tree structure pattern |

### 15. Table Functions (4 files)

Each file contains: CDS Table Function definition + AMDP class + Consuming CDS View.

| File | Table Function | AMDP Class | Feature |
|------|----------------|------------|---------|
| `ZPRAC_CDS_TF_SIMPLE` | `ZPRAC_TF_SIMPLE` | `ZCL_TF_SIMPLE` | Basic TF, SQLScript SELECT, USING clause |
| `ZPRAC_CDS_TF_PARAM` | `ZPRAC_TF_PARAM` | `ZCL_TF_PARAM` | WITH PARAMETERS, :param in SQLScript |
| `ZPRAC_CDS_TF_CURRENCY` | `ZPRAC_TF_CURRENCY` | `ZCL_TF_CURRENCY` | @Semantics.amount.currencyCode on TF results, CAST with currency |
| `ZPRAC_CDS_TF_DUMMY` | `ZPRAC_TF_DUMMY` | `ZCL_TF_DUMMY` | DUMMY table, IF/ELSE logic, local DECLARE, SQLScript CASE |

### 16. AMDP Classes (2 files)

| File | AMDP Class | Feature |
|------|------------|---------|
| `ZCL_AMDP_SIMPLE` | `ZCL_AMDP_SIMPLE` | BY DATABASE PROCEDURE, IMPORTING parameter, EXPORTING table |
| `ZCL_AMDP_DYNAMIC` | `ZCL_AMDP_DYNAMIC` | APPLY_FILTER, dynamic WHERE, cl_shdb_seltab=>combine_seltabs |

### 17. DCL / Access Control (1 file - concept)

| File | Type | Feature |
|------|------|---------|
| `ZPRAC_CDS_DCL` | Concept (.asr) | DCL syntax, ASPECT = PVZM, pfcg_auth, grant select with WHERE row-level security |

## Summary: Annotations Covered

| Annotation Category | Files | Examples |
|---|---|---|
| @AbapCatalog | All 42 CDS views | sqlViewName, compiler.compareFilter, preserveKey, viewExtension |
| @AccessControl | All 42 CDS views | authorizationCheck: #CHECK / #NOT_REQUIRED |
| @EndUserText | All 42 CDS views | label |
| @Semantics | 36 CDS views | amount.currencyCode, date, user.createdBy, user.lastChangedBy |
| @Environment | 10 CDS views | systemField: #CLIENT |
| @VDM | 5 CDS views | viewType: #PRIVATE / #BASIC / #COMPOSITE / #CONSUMPTION |
| @Analytics | 5 CDS views | dataCategory: #DIMENSION / #CUBE |
| @ObjectModel | 4 CDS views | dataType, compositionRoot, writeDraft, representativeKey, foreignKey |
| @OData | 4 CDS views | publish, entitySet.name, draft.enabled |
| @UI | 1 CDS view | headerInfo, lineItem, identification, selectionField |
| @Consumption | 1 CDS view | valueHelpDefinition, filter |
| @Search | 1 CDS view | searchable, defaultSearchElement, fuzzinessThreshold, ranking |
| @Metadata | 1 CDS view | allowExtensions |
| @Extensible | 1 CDS view | Extensible: true |
| @ClientHandling | 1 CDS view | algorithm: #AUTOMATIC_RHS / #INHERITED / #PROTECTED / #NO_CLIENT |

## How to Use This Reference

1. **Browse by feature** — File names are self-documenting (e.g. `ZPRAC_CDS_LEFT_JOIN` = Left Outer Join)
2. **Each file includes**: Header comment with key learning points + ABAP usage examples, complete CDS source with all annotations, proper @Semantics on all relevant fields
3. **Dependencies**: Activate dependent views first — `SIMPLE → VDM_BASIC → VDM_COMPOSITE → VDM_CONSUME`

## Prerequisites

- SAP S/4HANA or SAP BTP ABAP Environment
- `/DMO/` flight reference scenario (SAP demo/trial systems)
- ABAP Development Tools (ADT) in Eclipse
