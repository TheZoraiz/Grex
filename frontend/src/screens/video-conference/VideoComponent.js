import React, { useEffect, useRef } from 'react'

const VideoComponent = (props) => {
    const { track, stream, id, className } = props
	const vidEl = useRef(null);

    useEffect(() => {
        if(vidEl && track) {
            let tempStream = new MediaStream()
            tempStream.addTrack(track)
            vidEl.current.srcObject = tempStream

        } else if(vidEl && stream) {
            vidEl.current.srcObject = stream
        }
    }, [vidEl, track, stream])

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