import React from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import PropTypes from 'prop-types';
import Image from 'next/image'; // Assuming 'next/image' is correctly configured
// import ReviewIcon from '../../../../../../../public/images/apostila/review.png'; // Ensure this path is correct

// Helper function to process the content string into HTML
const processContentToHtml = (rawContent) => {
  if (!rawContent) {
    return '';
  }

  let htmlContent = rawContent;

  // IMPORTANT: Basic escaping of HTML special characters to prevent XSS if the content
  // might accidentally contain HTML. This is a very basic sanitizer.
  // For more robust sanitization, consider a library like DOMPurify if content
  // could come from less trusted sources or allow more complex HTML.
  // This step ensures that if user types "<div>hello</div>", it's shown as text, not as a div.
  const tempDiv = document.createElement('div');
  tempDiv.textContent = htmlContent;
  htmlContent = tempDiv.innerHTML;


  // Order of replacement matters:
  // 1. Bold: **text**
  // Using a non-greedy match (.*?) to handle multiple bolds correctly.
  htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 2. Italic: *text* or _text_ (ensure this doesn't conflict with bold)
  // Using a non-greedy match (.*?)
  // Note: This simple regex might have issues with nested or complex markdown.
  htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // htmlContent = htmlContent.replace(/_(.*?)_/g, '<em>$1</em>'); // Uncomment if you want to support _italic_ too

  // 3. Line breaks: \n to <br />
  // This should typically be done AFTER other HTML tag replacements,
  // or ensure those replacements don't introduce newlines that get BR'd.
  // Given the escaping above, this should be fine.
  htmlContent = htmlContent.replace(/\n/g, '<br />');

  return htmlContent;
};

const ReviewComponent = ({ node }) => {
  const { title, content } = node.attrs;
  const processedContent = processContentToHtml(content);

  return (
    <NodeViewWrapper className="react-component">
      <div className="flex flex-col bg-muted text-foreground rounded-xl px-6 py-4 my-4">
        <div className="flex items-center justify-center mb-4">
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          {/* Ensure ReviewIcon is imported and path is correct. Added error handling for Image. */}
          {/* <Image
            src={ReviewIcon}
            alt="Review Icon"
            width={48} // It's good practice to provide width/height for Next/Image
            height={48}
            className="w-12 h-12 ml-2"
            onError={(e) => {
              // Fallback or error styling if image fails to load
              e.target.style.display = 'none'; // Hide broken image icon
              console.error("Failed to load review icon");
            }}
          /> */}
        </div>

        {/* Use dangerouslySetInnerHTML to render the processed HTML content */}
        <div
          className="text-md font-normal text-justify leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />

        {/* NodeViewContent is typically used for editable content within the node.
            If this node is atom: true and content is only from attributes,
            this might not be used or needed. Leaving it as per your original code. */}
        <NodeViewContent className="content-area" />
      </div>
    </NodeViewWrapper>
  );
};

ReviewComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  // editor: PropTypes.object.isRequired, // editor is not directly passed here by default with ReactNodeViewRenderer
  // updateAttributes: PropTypes.func.isRequired, // updateAttributes is also not directly passed
  // selected: PropTypes.bool.isRequired, // selected is available
};

export default ReviewComponent;
