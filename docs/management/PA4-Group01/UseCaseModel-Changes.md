# UseCaseModel Changes – PA4

## Changes from PA3 / Previous Version

### 1. Authentication Actor Correction
- **Previous:** `User` was used for `Sign Up` in the revised model.
- **PA4:** `Guest User` is the actor for `UC01: Sign Up`.
- **Reason:** A person who has not registered should not be modeled as an already registered `User`.

### 2. UC IDs Restored in Diagrams
- **Previous:** Some diagrams displayed only the use-case name.
- **PA4:** Every diagram displays `UC01`–`UC56`.
- **Reason:** The TA requested that the IDs be visible for direct traceability to the specification.

### 3. Relationship Semantics Reviewed
- Mandatory sub-behaviors use `«include»` only when the base use case always invokes the sub-behavior.
- Conditional/optional behavior uses `«extend»`.
- `UC35: View Online Status` and `UC36: View Typing Indicator` are modeled as extensions of `UC31: View Conversations` because they depend on optional/conditional real-time states.
- `UC49` and `UC50` remain extensions of `UC48` because searching and inspecting a user are optional operations within user management.
- The direction of every `«include»` relationship is shown from the base use case to the included use case.

### 4. Search Use Cases
`UC28` and `UC29` remain separate use cases extending `UC27`, while implementation-specific details are removed from the model diagram.

### 5. Document Cleanup
The temporary feedback/repair note and duplicate responsibility table were removed.

### 6. Scope
The model keeps the same 56 use cases and 10 functional groups from the supplied PA4 model.
