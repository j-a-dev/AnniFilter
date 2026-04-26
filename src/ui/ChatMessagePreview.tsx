import { renderTemplate } from './templateRender'

/**
 * Chat message preview. Unlike the item plate, chat lines are plain text
 * with no background/border. Color is driven entirely by inline {<Color>}
 * tokens in the template; default is white.
 */
export function ChatMessagePreview({
  template,
  label,
}: {
  template: string
  label?: string
}) {
  const sampleName = label && label.length > 0 ? label : 'Sample Item'
  return (
    <span className="font-avqest text-[13px] tracking-wide leading-snug">
      {renderTemplate(template, '#e0e0e0', sampleName)}
    </span>
  )
}
