import React from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import PropTypes from 'prop-types';
import Image from 'next/image'; // Assuming 'next/image' is correctly configured
// import TeacherImage from '../../../../../../../public/images/apostila/teacher.png'; // Ensure this path is correct

// Helper function to process the content string into HTML
// This is the same function used in ReviewComponent.jsx
const processContentToHtml = (rawContent) => {
  if (!rawContent) {
    return '';
  }

  let htmlContent = rawContent;

  // IMPORTANT: Basic escaping of HTML special characters to prevent XSS.
  const tempDiv = document.createElement('div');
  tempDiv.textContent = htmlContent;
  htmlContent = tempDiv.innerHTML;

  // Order of replacement matters:
  // 1. Bold: **text**
  htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 2. Italic: *text*
  htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // htmlContent = htmlContent.replace(/_(.*?)_/g, '<em>$1</em>'); // Uncomment if you want to support _italic_ too


  // 3. Line breaks: \n to <br />
  htmlContent = htmlContent.replace(/\n/g, '<br />');

  return htmlContent;
};

const TextTeacherComponent = ({ node }) => {
  const { text } = node.attrs; // This is the attribute containing the text to be formatted
  const processedText = processContentToHtml(text);

  return (
    <NodeViewWrapper className="react-component">
      <div className='flex flex-row items-center justify-center bg-muted text-foreground w-full h-min rounded-3xl px-4 my-4'>
        <div className='w-full flex flex-row justify-between items-center'>
          {/* Ensure TeacherImage is imported and path is correct. Added error handling for Image. */}
          {/* <Image src={TeacherImage} alt="Teacher" className='w-[15%] h-auto' /> */}
          {/* Use destructiveouslySetInnerHTML to render the processed HTML text */}
          <div
            className='p-4 sm:p-7 text-md text-start w-full max-w-[85%] font-semibold' // Adjusted padding and max-width
            destructiveouslySetInnerHTML={{ __html: processedText }}
          />
        </div>
        {/* NodeViewContent is for editable content within the node.
            If this node is atom: true and content is only from attributes,
            this might not be used or needed. */}
        <NodeViewContent className="content-area" />
      </div>
    </NodeViewWrapper>
  );
};

// Define PropTypes
TextTeacherComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      text: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default TextTeacherComponent;
