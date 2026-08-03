import React from 'react'
import { Card, CardContent, Box, Typography } from '@mui/material'

interface Props {
  title: string
  icon?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export default function SectionCard({ title, icon, action, children }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 4, mb: 3, p: 1 }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && <Typography sx={{ mr: 1, fontSize: 20 }}>{icon}</Typography>}
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: 18 }}>
              {title}
            </Typography>
          </Box>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  )
}
