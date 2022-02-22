import React, { useEffect, useRef } from 'react'

const VideoComponent = (props) => {
    const { stream, id, className } = props
	const vidEl = useRef(null);

    useEffect(() => {
        if(vidEl && stream)
            vidEl.current.srcObject = stream
    }, [vidEl, stream])

    return (
        <video
            id={id}
            autoPlay
            ref={vidEl}
            className={className}
        />
    )
}

export default VideoComponent