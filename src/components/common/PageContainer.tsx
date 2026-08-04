import React from 'react'
import { Box } from '@mui/material'

interface Props {
  children: React.ReactNode
  maxWidth?: number
}

export default function PageContainer({ children, maxWidth = 1000 }: Props) {
  return (
    <Box
      sx={{
        maxWidth,
        mx: 'auto',
        px: { xs: 2, sm: 2.5, md: 3 },
        pt: { xs: 2, sm: 2.5, md: 3 },
        pb: 10,
      }}
    >
      {children}
    </Box>
  )
}
