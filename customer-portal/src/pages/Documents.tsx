import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Description as DocumentIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { RootState, AppDispatch } from '../store/store'
import { fetchDocuments, clearError } from '../store/slices/documentsSlice'

export default function Documents() {
  const dispatch = useDispatch<AppDispatch>()
  
  const { documents, isLoading, error } = useSelector((state: RootState) => state.documents)

  useEffect(() => {
    dispatch(fetchDocuments())
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <PdfIcon color="error" />
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon color="primary" />
      default:
        return <DocumentIcon />
    }
  }

  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'invoice':
        return 'primary'
      case 'warranty':
        return 'success'
      case 'certificate':
        return 'info'
      case 'quotation':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDownload = (document: any) => {
    // Create a temporary link to download the file
    const link = document.createElement('a')
    link.href = document.url
    link.download = document.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Documents
      </Typography>

      {documents.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" align="center">
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Your invoices, warranties, and certificates will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Document Categories */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Document Categories
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {Array.from(new Set(documents.map(doc => doc.type))).map(type => (
                    <Chip
                      key={type}
                      label={`${type} (${documents.filter(doc => doc.type === type).length})`}
                      color={getDocumentTypeColor(type) as any}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Documents List */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  All Documents
                </Typography>
                <List>
                  {documents.map((document, index) => (
                    <ListItem key={document.id} divider={index < documents.length - 1}>
                      <ListItemIcon>
                        {getDocumentIcon(document.name.split('.').pop() || '')}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {document.name}
                            </Typography>
                            <Chip
                              label={document.type}
                              size="small"
                              color={getDocumentTypeColor(document.type) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Created: {formatDate(document.created_at)}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="download"
                          onClick={() => handleDownload(document)}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}