import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Box,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import './styles/HelpSupport.css';

const HelpSupport = () => {
  const [expanded, setExpanded] = useState(false);

  const faqs = [
    {
      section: "📄 Getting Started",
      items: [
        {
          question: "How do I create an account?",
          answer: "Click the Login/Register button located at the top right corner in the header. Click on 'Register' button and fill in the required details."
        },
        {
          question: "How do I log in or log out?",
          answer: "Use the 'Log In/Register' button located at the top right corner in the header to access your account. To log out, click your profile icon and select 'Log Out'."
        }
      ]
    },
    {
      section: "👤 Managing Your Profile",
      items: [
        {
          question: "How do I edit my profile?",
          answer: "Go to your profile page and click 'Edit' button to change your picture, name, or bio."
        },
        {
          question: "Can I delete my profile?",
          answer: "Currently, you cannot delete your profile. Please contact support for assistance."
        }
      ]
    },
    {
      section: "📝 Using Posts",
      items: [
        {
          question: "How do I create a post?",
          answer: "On the home or feed page, click 'Create Post' button in the header, type your contents, and hit 'Post'."
        },
        {
          question: "How do I edit or delete a post?",
          answer: "Click the three dots (⋮) on your post to see options for editing or deleting it."
        },
        {
          question: "What kind of content is allowed?",
          answer: "Posts must follow community guidelines: no hate speech, spam, or adult content. Food contents are encouraged or any type of contents as long as it is wholesome for everyone."
        }
      ]
    }
  ];

  return (
    <div className="help-page-bg">
        <Container maxWidth="md" className="help-container">
        <Box display="flex" alignItems="center" justifyContent="center" className="help-title" sx={{ gap: 1 }}>
            <HelpOutlineIcon fontSize="large" style={{ color: '#FF4500' }} />
                <Typography variant="h4" fontWeight="700" style={{ color: '#FF4500' }}>
                    Help & Support
                </Typography>
        </Box>


        {faqs.map((section, sectionIndex) => (
            <Paper elevation={3} className="faq-card" key={sectionIndex}>
                <Typography variant="h6" className="section-title">
                    {section.section}
                </Typography>
                    {section.items.map((item, itemIndex) => (
                <Accordion
                    key={itemIndex} // Use itemIndex to ensure unique keys
                    expanded={expanded === `panel-${sectionIndex}-${itemIndex}`}
                    onChange={() =>
                    setExpanded(expanded === `panel-${sectionIndex}-${itemIndex}` ? false : `panel-${sectionIndex}-${itemIndex}`)
                    }
                    className="faq-accordion"
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className="faq-question">{item.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography className="faq-answer">{item.answer}</Typography>
                    </AccordionDetails>
                </Accordion>
                ))}
            </Paper>
            ))}
        </Container>
    </div>
    );
    };

export default HelpSupport;
