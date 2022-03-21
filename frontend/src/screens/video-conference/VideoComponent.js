import React, { useEffect, useRef } from 'react'

const VideoComponent = (props) => {
    const { tracks, stream, id, className, isMuted } = props
	const vidEl = useRef(null);

    useEffect(() => {
        if(vidEl && tracks) {
            let tempStream = new MediaStream()
            Object.values(tracks).forEach(track => {
                tempStream.addTrack(track)
            })
            vidEl.current.srcObject = tempStream

        } else if(vidEl && stream) {
            vidEl.current.srcObject = stream
        }
    }, [vidEl, tracks, stream])

    return (
        <video
            id={id}
            autoPlay
            ref={vidEl}
            className={className}
            muted={isMuted}
        />
    )
}

export default VideoComponent