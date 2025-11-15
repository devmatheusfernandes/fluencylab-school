import React, { useState } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import PropTypes from 'prop-types';

const BandImageComponent = ({ node }) => {
  const { imageUrl, text, position, size } = node.attrs;

  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state for enlarged image
  const [calculatedHeight, setCalculatedHeight] = useState('auto'); // Dynamic height

  const getFlexDirection = () => {
    if (!text) return 'flex-col items-center';
    switch (position) {
      case 'left': return 'flex-row items-center';
      case 'right': return 'flex-row-reverse items-center';
      case 'top': return 'flex-col';
      case 'bottom': return 'flex-col-reverse';
      default: return 'flex-col items-center justify-center';
    }
  };

  return (
    <NodeViewWrapper className="react-component flex flex-col justify-center items-center overflow-hidden">
      <div
        className={`flex ${getFlexDirection()}`}
        style={{ width: size, height: calculatedHeight }}
      >
        {imageUrl && (
          <div
            style={{ width: size, height: calculatedHeight, cursor: 'pointer' }}
            className="relative"
            onClick={() => setIsModalOpen(true)}
          >
            <img
              src={imageUrl}
              alt="Uploaded"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.target;
                setCalculatedHeight((parseInt(size) / naturalWidth) * naturalHeight + 'px');
              }}
            />
          </div>
        )}
        {text && <p className="text-md font-medium text-justify p-4">{text}</p>}
      </div>

      {/* Modal for enlarged image */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative p-4">
            <button
              className="absolute top-2 right-2 text-white text-3xl"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            <img
              src={imageUrl}
              alt="Enlarged"
              className="max-w-full max-h-screen rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
      <NodeViewContent />
    </NodeViewWrapper>
  );
};


BandImageComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      imageUrl: PropTypes.string,
      text: PropTypes.string,
      position: PropTypes.oneOf(['left', 'right', 'top', 'bottom']).isRequired,
      size: PropTypes.string.isRequired,
      height: PropTypes.string, // New optional height attribute
    }).isRequired,
  }).isRequired,
};

export default BandImageComponent;