// Renders only the markdown subset our own deterministic templates emit
// (lib/assistantIntents.ts): "## " headers, "- " bullet lists, and **bold**
// inline text. A full CommonMark dependency is unjustified weight for content
// we fully control the syntax of.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-white day:text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>
  })
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n")
  const blocks: React.ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return
    blocks.push(
      <ul key={key} className="list-disc list-inside space-y-1 my-1.5">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  lines.forEach((line, i) => {
    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2))
      return
    }
    flushList(`list-${i}`)

    if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={i} className="text-sm font-semibold text-white day:text-slate-900 mt-2 mb-1">
          {line.slice(3)}
        </h3>
      )
      return
    }

    if (line.trim() === "") {
      blocks.push(<div key={i} className="h-1.5" />)
      return
    }

    blocks.push(
      <p key={i} className="leading-relaxed">
        {renderInline(line, `p-${i}`)}
      </p>
    )
  })

  flushList("list-end")

  return <div className="space-y-0.5">{blocks}</div>
}
