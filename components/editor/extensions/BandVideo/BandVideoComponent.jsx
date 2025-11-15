import React from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';

const BandVideoComponent = ({ node }) => {
  const { url } = node.attrs;

  const getEmbedUrl = (url) => {
    let embedUrl = '';

    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)\/view/);
    if (googleDriveMatch) {
      embedUrl = `https://drive.google.com/file/d/${googleDriveMatch[1]}/preview`;
    }

    return embedUrl;
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return <p>Invalid URL. Please provide a valid YouTube or Google Drive link.</p>;
  }

  return (
    <NodeViewWrapper className="react-component">
      <div className='h-full w-full flex flex-col justify-center items-center'>
        <iframe
          className="aspect-video w-full rounded-md"
          src={embedUrl}
          allowFullScreen
          title="Embedded Content"
        ></iframe>
       </div>
      <NodeViewContent className="content is-editable" />
    </NodeViewWrapper>
  );
};

export default BandVideoComponent;
