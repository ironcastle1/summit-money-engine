# Local MERLIN AI

MERLIN V4 has no paid AI SDK dependency. `src/local-ai/client.js` talks to a model runtime bound to the local machine. The default address is `http://127.0.0.1:11434`.

The current Windows installer uses Ollama as the inference runtime because it provides a simple local model server, model management and tool-call support. Ollama is not a paid inference provider in this architecture; it is the program that executes the model on the owner's hardware.

The runtime can be replaced later if MERLIN gains another Ollama-compatible local endpoint. Business data remains in MERLIN, not in the model runtime.

The agent receives a bounded current-business context and a strict tool list. It can query orders, inventory, products, market evidence and memory. Write tools are limited to explicit business mutations such as an owner reporting a purchase, order, production run, sale, expense or real capability upgrade.

For common material purchases and basic expense commands, MERLIN first uses deterministic parsing. This path does not require AI inference and is intended to keep routine record keeping reliable on small local models.
