/**
 * Email Sender Module
 * Handles email sending via EmailJS by initializing with a public key, serviceId and templateId
 * and sending form data on submission.
 *
 * Dependencies: EmailJS (https://www.emailjs.com/)
 * Usage: Call `emailSender()` to enable email-sending functionality.
 */

import { personalData } from "../data/personal-data.js";

export default function emailSender() {
    // add you publicKey serviceId and templateId in data forlder (personal-data.js)
    const publicKey = personalData.publicKey;
    const serviceId = personalData.serviceId;
    const templateId = personalData.templateId;

    // Initialize EmailJS with the public key
    emailjs.init(publicKey);
    
    document.querySelector("#contact-form").addEventListener("submit", (event) => {
        event.preventDefault();

        // Collect form data from input fields
        const formData = {
            name: document.getElementById("name-input").value,   // User's name
            email: document.getElementById("email-input").value, // User's email
            message: document.getElementById("message-input").value // User's message
        };

        console.log("Sending email with data:", formData); // Log the form data for debugging

        // Send the email using EmailJS
        emailjs.send(serviceId, templateId, formData)
            .then((response) => {
                // Success callback
                console.log("Email sent successfully:", response); // Log the success response
                alert("Message sent successfully!"); // Notify the user of success
                document.getElementById("contact-form").reset(); // Reset the form fields
            })
            .catch((error) => {
                // Error callback
                console.error("Failed to send email:", error); // Log the error
                alert("Failed to send message. Please try again."); // Notify the user of failure
            });
    });
}
