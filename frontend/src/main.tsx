import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 🌟 Import Amplify core utilities
import { Amplify } from 'aws-amplify'

// 🔐 Bind your live AWS Cognito Infrastructure credentials
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_Ux7HWawOn',
      userPoolClientId: '13hara7lltb6h5kohvoqpgiptq'
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)