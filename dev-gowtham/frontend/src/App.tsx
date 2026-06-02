import { useState } from 'react'
import { Box } from '@mui/material'
import Sidebar from './components/Sidebar'
import TopStepper from './components/TopStepper'
import UploadPanel from './components/UploadPanel'
import ConnectSources from './components/ConnectSources'
import AIAssistant from './components/AIAssistant'

function App() {
  const [externalFile, setExternalFile] = useState<{ name: string; type: string; source: string } | null>(null)
  const [fileCount, setFileCount] = useState(0)

  const handleItemSelected = (item: { name: string; type: string; source: string }) => {
    setExternalFile({ name: item.name, type: item.type, source: item.source })
    setFileCount(prev => prev + 1)
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f8fafc' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopStepper activeStep={1} />
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <UploadPanel externalFile={externalFile} />
          <Box sx={{ width: 380, flexShrink: 0, borderLeft: '1px solid #e2e8f0' }}>
            <ConnectSources onItemSelected={handleItemSelected} />
          </Box>
        </Box>
      </Box>
      <AIAssistant fileCount={fileCount} />
    </Box>
  )
}

export default App