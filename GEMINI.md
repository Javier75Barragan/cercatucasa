
## graphify

This project has a nodesify-graphify knowledge graph at .graphify/.

Rules:
- Before answering architecture or codebase questions, read .graphify/graph_report.md for god nodes and community structure
- For cross-module "how does X relate to Y" questions, prefer `nodesify-graphify query "<question>"`, `nodesify-graphify path "<A>" "<B>"`, or `nodesify-graphify explain "<concept>"` over grep
- After modifying code files in this session, run `nodesify-graphify update .` to keep the graph current
