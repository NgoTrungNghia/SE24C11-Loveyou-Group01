# UseCaseSpecification Changes – PA4

## Changes from Previous Version

### 1. Actor Correction
- `UC01: Sign Up` now uses `Guest User (Primary)`.
- Login supports `Guest User / User / Admin` according to the model.
- Other authenticated functions use `User` or `Admin` as appropriate.

### 2. Technical Detail Reduction
The previous specification contained implementation details such as:
- bcrypt cost factors
- JWT tokens and token TTLs
- REST/API paths
- HTTP status codes
- database queries and table/record details
- WebSocket events
- framework/service implementation details

These were removed from the use-case flows. The revised specification focuses on user actions, system responses, preconditions, postconditions, and visible behavior.

### 3. Alternative Flow Prototypes
The previous document often had only one prototype for the main flow and reused unrelated screenshots. The revised specification gives each UC:
- a main-flow prototype reference; and
- a separate prototype reference for each alternative flow that produces a visible UI state.

### 4. Prototype Traceability
Prototype names now follow a consistent convention such as:
`prototypes/uc28_search_filters.png`
and
`prototypes/uc28_af1_reset_filters.png`.

### 5. UC ID Traceability
Every specification section retains its `UCxx` identifier so that it maps directly to the Use-Case Model.

### 6. Consistency
The revised specification uses the same 56 UC names and 10 Functional Groups as the revised Use-Case Model.
