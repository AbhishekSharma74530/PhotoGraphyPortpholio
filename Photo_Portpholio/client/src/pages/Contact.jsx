import { useState } from 'react';
import { motion } from 'framer-motion';

const Contact = ({ darkMode }) => {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuccess(true);
          e.target.reset();
        } else {
          alert("Something went wrong!");
        }
      })
      .catch(() => alert("Failed to send message."));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#000' : '#f5f5f5',
        color: darkMode ? '#fff' : '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // shift up
        padding: '80px 20px 40px', // top padding added
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: darkMode ? '#111' : '#fff',
        borderRadius: '14px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(6px)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>📬 Contact Me</h2>

        {success && (
          <div style={{
            padding: '10px',
            backgroundColor: 'green',
            color: 'white',
            borderRadius: '6px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ✅ Message sent successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="hidden" name="access_key" value="8055d0be-c260-4299-a7bf-77fe827fd882" />
          <input type="hidden" name="subject" value="New Contact Form Submission" />
          <input type="hidden" name="from_name" value="Photo Portfolio Contact" />

          <input
            type="text"
            name="name"
            placeholder="Your Name"
            required
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none'
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            required
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none'
            }}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            required
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none',
              resize: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#007bff',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Send Message
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Contact;
