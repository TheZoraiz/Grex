import React, { useEffect, useRef, useState } from 'react'
import PSPDFKit from 'pspdfkit'

const PDFViewer = (props) => {
    const pdfRef = useRef(null)
    const instanceRef = useRef(null)

    const [instance, setInstance] = useState(null)
    const [tempViewState, setTempViewState] = useState(null)

    useEffect(async() => {
        let defaultToolbarItems = PSPDFKit.defaultToolbarItems.filter(item => {
            let allowedItems = [
                'pager',
                'pan',
                'zoom-out',
                'zoom-in',
                'spacer',
                // 'ink',
                // 'highlighter',
                // 'text-highlighter',
                // 'ink-eraser',
                'search',
                'export-pdf',
            ]

            if(allowedItems.indexOf(item.type) !== -1)
                return true
            return false
        })

        let tempInstance = await PSPDFKit.load({
            container: pdfRef.current,
            theme: PSPDFKit.Theme.DARK,
            toolbarItems : defaultToolbarItems,
            document: props.document,
            baseUrl: `${window.location.protocol}//${window.location.host}/`,
        })

        tempInstance.addEventListener('viewState.currentPageIndex.change', (pageIndex) => {
            if(props.isHost)
                props.handleChangeLiveFileViewState(pageIndex)
        })

        console.log(PSPDFKit.defaultToolbarItems)

        setInstance(tempInstance);
        instanceRef.current = tempInstance

        return () => {
            PSPDFKit.unload(pdfRef.current)
        }
    }, [])

    useEffect(() => {
        if(tempViewState)
            console.log(tempViewState.toJS())
            // props.socket.emit('live-file-viewstate-update', {
            //     room: props.joinRoom,
            //     tempViewState,
            // })
    }, [tempViewState])

    useEffect(() => {
        if(props.viewState && instance) {
            let viewState = instance.viewState
            instance.setViewState(viewState.set('currentPageIndex', props.viewState))
        }
    }, [props.viewState])

    return (
        <div
            ref={pdfRef}
            className='h-full w-full'
        />
    )
}

export default PDFViewer