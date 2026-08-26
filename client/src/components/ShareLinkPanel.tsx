import React, { useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import { buildShareLink } from '../shareLink'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;

  .link {
    font-size: 13px;
    color: #c2c2c2;
    background: #00000044;
    border-radius: 4px;
    padding: 4px 8px;
    overflow-wrap: anywhere;
    user-select: all;
    flex: 1;
    min-width: 0;
  }

  .copied {
    font-size: 13px;
    color: #42eacb;
    white-space: nowrap;
  }
`

export function ShareLinkPanel({ roomId, slug }: { roomId: string; slug: string | null }) {
  const [copied, setCopied] = useState(false)
  const link = buildShareLink(roomId, slug)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard needs a secure context and permission; the link is selectable
      // either way, so this just falls back to copying it by hand
    }
  }

  return (
    <Wrapper>
      <div className="link">{link}</div>
      {copied ? (
        <span className="copied">Copied</span>
      ) : (
        <Tooltip title="Copy link">
          <IconButton size="small" onClick={copy} aria-label="copy room link">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Wrapper>
  )
}
