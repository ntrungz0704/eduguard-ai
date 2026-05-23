# ADR 003: Local-First AI over Cloud LLMs

## Status
Accepted

## Context
Many modern EdTech tools are integrating conversational AI by passing user queries and data directly to 3rd-party LLM providers like OpenAI or Anthropic. 

## Decision
We mandate a **Local-First AI architecture**. All intent mapping (via `node-nlp`), statistical analytics, and Machine Learning predictions (`@tensorflow/tfjs`) must execute on the host server. We explicitly forbid sending student data to external API endpoints.

## Consequences
**Positive:**
- 100% control over Data Privacy (designed to support FERPA/GDPR compliance).
- Zero recurring API costs per token.
- Deterministic behavior: We avoid "LLM Hallucinations" by relying on bounded, rule-based mappings.

**Negative:**
- The NLP engine cannot perform deep semantic reasoning or generate novel prose.
- Development effort is higher, as we must manually define training utterances and rules rather than relying on generalized foundational models.

**Mitigation:**
We use Markdown-based structured response templates. The backend injects the analytical variables into these templates, providing a professional and highly structured UX that compensates for the lack of generative capabilities.
