import React from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import PropTypes from 'prop-types';
import Image from 'next/image';
// import TipImage from '../../../../../../../public/images/apostila/tip.png';

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

const TextTipComponent = ({ node }) => {
  const { text } = node.attrs;
  const processedText = processContentToHtml(text);

  return (
    <NodeViewWrapper className="react-component">
      <div className='flex flex-row items-center justify-center bg-muted text-foreground w-full h-min rounded-3xl px-4'>
        <div className='w-full flex flex-row justify-between items-center'>
          {/* <Image src={TipImage} alt="Teacher" className='w-[13%] h-auto' /> */}
          <div
            className='p-4 sm:p-7 text-md text-start w-full max-w-[85%] font-semibold' // Adjusted padding and max-width
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        </div>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

// Define PropTypes
TextTipComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      text: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default TextTipComponent;
