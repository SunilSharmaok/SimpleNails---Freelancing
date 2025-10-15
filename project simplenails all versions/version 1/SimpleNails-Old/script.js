// Global Variables
let currentAmount = 0;
let formLocked = false;
let fileUploaded = false;
let isSubmitting = false;
let uploadcareWidget;
let user = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initImageComparison();
  initStatsCounter();
  initGoogleSignIn();
  initFormSteps();
  initFileUpload();
  initPaymentMethods();
  checkAuthState();
  
  // Prevent auto-scroll to policies
  if (window.location.hash === '#privacy' || window.location.hash === '#terms' || 
      window.location.hash === '#refund' || window.location.hash === '#shipping') {
    setTimeout(() => {
      showPolicy(window.location.hash.substring(1));
    }, 500);
  }
});

// Mobile Menu Toggle
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav');
  
  if (mobileMenuBtn && nav) {
    mobileMenuBtn.addEventListener('click', () => {
      nav.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
      });
    });
  }
}

// Image Comparison Slider
function initImageComparison() {
  const slider = document.querySelector('.slider');
  const before = document.querySelector('.before');
  
  if (slider && before) {
    let isDragging = false;
    
    slider.addEventListener('touchstart', () => isDragging = true);
    document.addEventListener('touchend', () => isDragging = false);
    
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      updateSliderPosition(e.touches[0].clientX);
    });
    
    slider.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updateSliderPosition(e.clientX);
    });
  }
}

function updateSliderPosition(xPos) {
  const container = document.querySelector('.image-comparison');
  const before = document.querySelector('.before');
  const slider = document.querySelector('.slider');
  
  if (!container) return;
  
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerLeft = containerRect.left;
  
  xPos = Math.max(0, Math.min(xPos - containerLeft, containerWidth));
  const percentage = (xPos / containerWidth) * 100;
  before.style.width = `${percentage}%`;
  slider.style.left = `${percentage}%`;
}

// Stats Counter Animation
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  
  if (statNumbers.length > 0) {
    const animateStats = () => {
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        const suffix = stat.textContent.match(/\D+$/)?.[0] || '';
        let count = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        
        const updateCount = () => {
          count += increment;
          if (count < target) {
            stat.textContent = Math.floor(count) + suffix;
            requestAnimationFrame(updateCount);
          } else {
            stat.textContent = target + suffix;
          }
        };
        updateCount();
      });
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) observer.observe(heroStats);
  }
}

// Google Sign-In Implementation
function initGoogleSignIn() {
  if (typeof google !== 'undefined') {
    initializeGoogleSignIn();
  } else {
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined') {
        clearInterval(checkGoogle);
        initializeGoogleSignIn();
      }
    }, 100);
  }
}

function initializeGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: '1090374563448-um6976ib751v5npaas9fbm5gpolga8a1.apps.googleusercontent.com',
    callback: handleGoogleSignIn,
    auto_select: false,
    cancel_on_tap_outside: false
  });
  
  document.querySelectorAll('.g_id_signin').forEach(element => {
    google.accounts.id.renderButton(
      element,
      { 
        theme: 'outline', 
        size: 'medium',
        shape: 'pill',
        text: 'signin_with',
        logo_alignment: 'left'
      }
    );
  });
  
  document.getElementById('sign-out')?.addEventListener('click', signOut);
}

function handleGoogleSignIn(response) {
  user = response.credential;
  const userData = parseJwt(user);
  
  localStorage.setItem('googleUser', JSON.stringify(userData));
  updateUserProfile(userData);
  
  document.querySelectorAll('.g_id_signin').forEach(el => el.style.display = 'none');
  document.getElementById('user-profile').style.display = 'flex';
  document.getElementById('signin-modal').style.display = 'none';
  
  document.body.classList.add('signed-in');
  loadUserSubmissions(userData.email);
  
  Swal.fire({
    title: 'Sign in Success!',
    text: `Welcome, ${userData.name || 'User'}!`,
    icon: 'success'
  });
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

function updateUserProfile(userData) {
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  
  if (userAvatar) userAvatar.src = userData.picture || 'https://www.gravatar.com/avatar/default';
  if (userName) userName.textContent = userData.name || 'User';
}

function signOut() {
  user = null;
  localStorage.removeItem('googleUser');
  
  if (typeof google !== 'undefined') {
    google.accounts.id.disableAutoSelect();
  }
  
  const headerSignIn = document.querySelector('.auth-section .g_id_signin');
  const userProfile = document.getElementById('user-profile');
  
  if (headerSignIn) headerSignIn.style.display = 'block';
  if (userProfile) userProfile.style.display = 'none';
  
  if (!headerSignIn) {
    document.getElementById('signin-modal').style.display = 'flex';
  }
  
  document.body.classList.remove('signed-in');
  window.location.href = window.location.pathname;
  
  Swal.fire({
    title: 'Signed Out',
    text: 'You have been successfully signed out.',
    icon: 'success'
  });
}

function checkAuthState() {
  const storedUser = localStorage.getItem('googleUser');
  const headerSignIn = document.querySelector('.auth-section .g_id_signin');
  const userProfile = document.getElementById('user-profile');
  
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    updateUserProfile(userData);
    document.getElementById('signin-modal').style.display = 'none';
    document.body.classList.add('signed-in');
    if (headerSignIn) headerSignIn.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    loadUserSubmissions();
  } else {
    if (!headerSignIn) {
      document.getElementById('signin-modal').style.display = 'flex';
    }
    document.body.classList.remove('signed-in');
    if (headerSignIn) headerSignIn.style.display = 'block';
    if (userProfile) userProfile.style.display = 'none';
  }
}

// Form Step Navigation
function initFormSteps() {
  document.querySelectorAll('.next-step').forEach(button => {
    button.addEventListener('click', function() {
      const currentStep = document.querySelector('.form-step.active');
      const nextStepId = this.getAttribute('data-next');
      const nextStep = document.querySelector(`.form-step[data-step="${nextStepId}"]`);
      
      if (validateStep(currentStep.getAttribute('data-step'))) {
        currentStep.classList.remove('active');
        nextStep.classList.add('active');
        updateProgressSteps(nextStepId);
        
        if (nextStepId === '3') {
          updateReviewSection();
        }
        
        nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  document.querySelectorAll('.prev-step').forEach(button => {
    button.addEventListener('click', function() {
      const currentStep = document.querySelector('.form-step.active');
      const prevStepId = this.getAttribute('data-prev');
      const prevStep = document.querySelector(`.form-step[data-step="${prevStepId}"]`);
      
      currentStep.classList.remove('active');
      prevStep.classList.add('active');
      updateProgressSteps(prevStepId);
      prevStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  
  document.getElementById('cancel-form-btn')?.addEventListener('click', function() {
    Swal.fire({
      title: 'Cancel Form?',
      text: 'Are you sure you want to clear all entered information?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff0000',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, clear it!'
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
      }
    });
  });
  
  document.getElementById("serviceField")?.addEventListener("change", function() {
    if (formLocked) return;
    document.getElementById("service_hidden").value = this.value;
  });
  
  document.getElementById("editingPreferences")?.addEventListener("change", function() {
    if (formLocked) return;
    
    const value = this.value;
    if (value.includes("Basic")) currentAmount = 100;
    else if (value.includes("Full")) currentAmount = 1000;
    else if (value.includes("Custom")) currentAmount = 2000;
    
    document.getElementById("editing_preferences_hidden").value = value;
    updateAmountDisplay();
  });
}

function resetForm() {
  document.getElementById('projectForm').reset();
  uploadcareWidget?.value(null);
  currentAmount = 0;
  updateAmountDisplay();
  
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  document.querySelector('.form-step[data-step="1"]').classList.add('active');
  updateProgressSteps('1');
}

function validateStep(stepId) {
  if (stepId === '1') {
    const requiredFields = ['name', 'email', 'mobile', 'service', 'editingPreferences', 'message'];
    for (const field of requiredFields) {
      const element = document.getElementById(field === 'editingPreferences' ? 'editingPreferences' : `${field}Field`);
      if (!element.value.trim()) {
        Swal.fire({
          title: 'Missing Information',
          text: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`,
          icon: 'warning'
        });
        element.focus();
        return false;
      }
    }
    
    const email = document.getElementById('emailField').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({
        title: 'Invalid Email',
        text: 'Please enter a valid email address',
        icon: 'warning'
      });
      document.getElementById('emailField').focus();
      return false;
    }
    
    const mobile = document.getElementById('mobileField').value;
    if (!/^\d{10}$/.test(mobile)) {
      Swal.fire({
        title: 'Invalid Mobile',
        text: 'Please enter a valid 10-digit mobile number',
        icon: 'warning'
      });
      document.getElementById('mobileField').focus();
      return false;
    }
    
    return true;
  } else if (stepId === '2') {
    const files = uploadcareWidget?.value();
    if (!files && !document.getElementById('file_hidden').value) {
      Swal.fire({
        title: 'Files Required',
        text: 'Please upload at least one file to continue',
        icon: 'warning'
      });
      return false;
    }
    return true;
  }
  return true;
}

function updateProgressSteps(activeStep) {
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
    if (parseInt(step.getAttribute('data-step')) <= parseInt(activeStep)) {
      step.classList.add('active');
    }
  });
}

function updateAmountDisplay() {
  const amountDisplay = document.getElementById('amount-value');
  if (amountDisplay) {
    amountDisplay.textContent = currentAmount / 100;
  }
}

// File Upload Handling
function initFileUpload() {
  uploadcareWidget = uploadcare.Widget('[role=uploadcare-uploader]');
  
  uploadcareWidget.onUploadComplete(function(fileInfo) {
    if (fileInfo) {
      document.getElementById('file_hidden').value = fileInfo.cdnUrl;
      updateFilePreviews([fileInfo]);
      document.getElementById('file-upload-status').style.display = 'block';
    }
  });
  
  uploadcareWidget.onChange(function(fileGroup) {
    if (fileGroup) {
      fileGroup.files().done(function(files) {
        updateFilePreviews(files);
      });
    } else {
      document.getElementById('file_hidden').value = '';
      document.getElementById('file-previews').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-upload"></i>
          <p>No files selected yet</p>
        </div>
      `;
      document.getElementById('file-upload-status').style.display = 'none';
    }
  });
  
  document.getElementById('paste-url-btn')?.addEventListener('click', async function() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        try {
          new URL(text);
          uploadcareWidget?.value(text);
          Swal.fire({
            title: 'URL Added',
            text: 'The URL from your clipboard has been added',
            icon: 'success'
          });
        } catch (e) {
          Swal.fire({
            title: 'Invalid URL',
            text: 'The text in your clipboard is not a valid URL',
            icon: 'error'
          });
        }
      } else {
        Swal.fire({
          title: 'No URL Found',
          text: 'Your clipboard does not contain a URL',
          icon: 'warning'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Clipboard Access Denied',
        text: 'Please paste the URL manually',
        icon: 'error'
      });
    }
  });
}

function updateFilePreviews(files) {
  const previewsContainer = document.getElementById('file-previews');
  
  if (files.length === 0) {
    previewsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-upload"></i>
        <p>No files selected yet</p>
      </div>
    `;
    return;
  }
  
  previewsContainer.innerHTML = '';
  
  files.forEach(file => {
    const preview = document.createElement('div');
    preview.className = 'file-preview';
    
    const isImage = file.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const fileSize = (file.size / 1024).toFixed(1);
    
    preview.innerHTML = `
      ${isImage ? `<img src="${file.cdnUrl}" alt="${file.name}">` : `<i class="fas fa-file-alt" style="font-size:3rem;color:#6c757d;margin:10px 0;"></i>`}
      <div class="file-name">${file.name}</div>
      <div class="file-size">${fileSize} KB</div>
      <div class="remove-file" data-url="${file.cdnUrl}">
        <i class="fas fa-times"></i>
      </div>
    `;
    
    previewsContainer.appendChild(preview);
  });
  
  document.querySelectorAll('.remove-file').forEach(button => {
    button.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      removeFileFromWidget(url);
    });
  });
}

function removeFileFromWidget(url) {
  const files = uploadcareWidget?.value();
  if (files) {
    files.remove(uploadcare.FileFrom('uploaded', { cdnUrl: url }));
  }
}

// Update Review Section
function updateReviewSection() {
  document.getElementById('review-name').textContent = 
    document.getElementById('nameField').value || 'Not selected';

    document.getElementById('review-email').textContent = 
    document.getElementById('emailField').value || 'Not selected';

    document.getElementById('review-mobile').textContent = 
    document.getElementById('mobileField').value || 'Not selected';

    document.getElementById('review-message').textContent = 
    document.getElementById('messageField').value || 'Not selected';

  document.getElementById('review-service').textContent = 
    document.getElementById('serviceField').value || 'Not selected';
  
  document.getElementById('review-editing').textContent = 
    document.getElementById('editingPreferences').value || 'Not selected';
  
  const filesCount = uploadcareWidget?.value()?.files().length || 
    (document.getElementById('file_hidden').value ? 1 : 0);
  document.getElementById('review-files').textContent = 
    `${filesCount} file${filesCount !== 1 ? 's' : ''}`;
  
  const amount = currentAmount / 100;
  document.getElementById('review-total').textContent = `₹${amount}`;
  document.getElementById('pay-amount').textContent = amount;
}

// Payment Method Selection
function initPaymentMethods() {
  document.getElementById('pay-submit-btn')?.addEventListener('click', startRazorpayPayment);
}

// Razorpay Payment
window.startRazorpayPayment = async function() {
  if (formLocked) return;
  
  if (!document.getElementById('terms-agreement').checked) {
    Swal.fire({
      title: 'Terms Required',
      text: 'You must agree to the Terms & Conditions to proceed',
      icon: 'warning',
      confirmButtonColor: '#3f37c9'
    });
    return;
  }

  try {
    const name = document.getElementById('nameField').value.trim();
    const email = document.getElementById('emailField').value.trim();
    const mobile = document.getElementById('mobileField').value.trim();
    const service = document.getElementById("service_hidden").value;
    const editingPref = document.getElementById("editing_preferences_hidden").value;
    const message = document.getElementById('messageField').value.trim();
    const currentFile = uploadcareWidget?.value();

    // Validation
    if (!name || !email || !mobile || !service || !editingPref || !message) {
      throw new Error("Please fill out all required fields before payment.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    if (!/^\d{10}$/.test(mobile)) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }

    if (!currentFile && !document.getElementById("file_hidden").value) {
      throw new Error("Please upload at least one file before payment.");
    }

    const options = {
      key: "rzp_live_d1ztgTzZgzHEpL",
      amount: currentAmount,
      currency: "INR",
      name: "SimpleNails",
      description: "Project Payment",
      handler: async function(response) {
        try {
          document.getElementById("razorpay_payment_id").value = response.razorpay_payment_id;
          document.getElementById("razorpay-button-container").style.display = "none";
          lockFormFields();
          
          Swal.fire({
            title: 'Processing...',
            html: 'Please wait while we submit your project',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          
          // Get the form data
          const form = document.getElementById('projectForm');
          const formData = new FormData(form);
          
          // Add payment status
          formData.append('payment_status', 'completed');
          
          // Submit the form
          const submissionResponse = await fetch(form.action, {
            method: 'POST',
            body: formData
          });

          if (submissionResponse.ok) {
            // Add to submission history
            addSubmissionToHistory(formData);
            
            Swal.fire({
              title: "Success!",
              text: "Your project has been submitted successfully!",
              icon: "success"
            }).then(() => {
              resetForm();
              unlockFormFields();
              window.location.href = "#dashboard";
            });
          } else {
            throw new Error("Form submission failed. Please contact support.");
          }
        } catch (error) {
          console.error('Submission error:', error);
          Swal.fire({
            title: "Error",
            text: error.message || "Failed to complete submission",
            icon: "error"
          });
          unlockFormFields();
        }
      },
      prefill: { name, email, contact: mobile },
      theme: { color: "#3f37c9" },
      modal: {
        ondismiss: function() {
          Swal.fire({
            title: 'Payment Cancelled',
            text: 'You cancelled the payment process',
            icon: 'warning'
          });
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
    
    rzp.on('payment.failed', function(response) {
      Swal.fire({
        title: 'Payment Failed',
        text: response.error.description || 'Payment could not be completed',
        icon: 'error'
      });
    });
    
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error"
    });
  }
};

// Form Submission Functions
function lockFormFields() {
  formLocked = true;
  ['nameField', 'emailField', 'mobileField', 'messageField'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.readOnly = true;
  });
  
  ['serviceField', 'editingPreferences'].forEach(id => {
    const select = document.getElementById(id);
    if (select) select.disabled = true;
  });
  
  if (uploadcareWidget?.input) {
    uploadcareWidget.input.disabled = true;
  }
  
  const nda = document.getElementById('nda');
  if (nda) nda.disabled = true;
}

function unlockFormFields() {
  formLocked = false;
  ['nameField', 'emailField', 'mobileField', 'messageField'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.readOnly = false;
  });
  
  ['serviceField', 'editingPreferences'].forEach(id => {
    const select = document.getElementById(id);
    if (select) select.disabled = false;
  });
  
  if (uploadcareWidget?.input) {
    uploadcareWidget.input.disabled = false;
  }
  
  const nda = document.getElementById('nda');
  if (nda) nda.disabled = false;
}

// My Submissions Section
function loadUserSubmissions(userEmail = null) {
  const submissionHistory = document.querySelector('.submission-history');
  if (!submissionHistory) return;

  let allSubmissions = JSON.parse(localStorage.getItem('userSubmissions')) || [];
  let submissions = userEmail 
    ? allSubmissions.filter(sub => sub.email === userEmail)
    : allSubmissions;
  
  submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (submissions.length === 0) {
    submissionHistory.innerHTML = `
      <div class="no-submissions">
        <i class="fas fa-inbox"></i>
        <h3>No Submissions Yet</h3>
        <p>You haven't submitted any projects yet. Start by creating your first project!</p>
        <a href="#contact" class="btn btn-primary">Start a Project</a>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="submission-navigation">
      <h3>Your Projects</h3>
      <span id="submission-counter">${submissions.length} ${submissions.length === 1 ? 'submission' : 'submissions'}</span>
    </div>
  `;
  
  submissions.forEach((submission, index) => {
    const date = new Date(submission.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let status = 'Pending';
    let statusClass = 'badge-warning';
    
    if (submission.payment_id) {
      status = 'Submitted';
      statusClass = 'badge-success';
    } else if (submission.error) {
      status = 'Failed';
      statusClass = 'badge-danger';
    }
    
    let filePreviews = '';
    if (submission.file) {
      if (typeof submission.file === 'string') {
        if (submission.file.match(/\.(jpg|jpeg|png|gif)$/i)) {
          filePreviews = `<img src="${submission.file}" alt="Uploaded file">`;
        } else {
          filePreviews = `<a href="${submission.file}" class="file-link" target="_blank">Download File</a>`;
        }
      } else if (Array.isArray(submission.file)) {
        submission.file.forEach(file => {
          if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
            filePreviews += `<img src="${file}" alt="Uploaded file">`;
          } else {
            filePreviews += `<a href="${file}" class="file-link" target="_blank">Download File</a>`;
          }
        });
      }
    }
    
    html += `
      <div class="submission-item">
        <div class="submission-header">
          <h4>Project #${submissions.length - index}</h4>
          <span class="submission-date">${formattedDate}</span>
        </div>
        <div class="submission-content">
          <div class="detail-row">
            <div class="detail-label">Status:</div>
            <div class="detail-value">
              <span class="badge ${statusClass}">${status}</span>
              ${submission.payment_id ? `(Payment ID: ${submission.payment_id})` : ''}
            </div>
          </div>
          ${generateSubmissionDetail('Name', submission.name)}
          ${generateSubmissionDetail('Email', submission.email)}
          ${generateSubmissionDetail('Mobile', submission.mobile)}
          ${generateSubmissionDetail('Service', submission.service)}
          ${generateSubmissionDetail('Editing Level', submission.editing_preferences)}
          <div class="detail-row full-width">
            <div class="detail-label">Project Details:</div>
            <div class="detail-value">${submission.message || 'No details provided'}</div>
          </div>
          ${filePreviews ? `
          <div class="detail-row full-width">
            <div class="detail-label">Files:</div>
            <div class="file-previews">${filePreviews}</div>
          </div>
          ` : ''}
          ${submission.nda ? `
          <div class="detail-row">
            <div class="detail-label">NDA Requested:</div>
            <div class="detail-value">Yes</div>
          </div>
          ` : ''}
          ${submission.error ? `
          <div class="detail-row full-width">
            <div class="detail-label">Error:</div>
            <div class="detail-value error-message">${submission.error}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  submissionHistory.innerHTML = html;
}

function generateSubmissionDetail(label, value) {
  return `
    <div class="detail-row">
      <div class="detail-label">${label}:</div>
      <div class="detail-value">${value || 'N/A'}</div>
    </div>
  `;
}

function addSubmissionToHistory(formData) {
  let submissions = JSON.parse(localStorage.getItem('userSubmissions')) || [];
  const storedUser = localStorage.getItem('googleUser');
  const userEmail = storedUser ? JSON.parse(storedUser).email : null;
  
  const newSubmission = {
    timestamp: new Date().toISOString(),
    name: formData.get('name'),
    email: userEmail || formData.get('email'),
    mobile: formData.get('mobile'),
    service: formData.get('service'),
    editing_preferences: formData.get('Editing_Preferences'),
    message: formData.get('message'),
    file: formData.get('file'),
    payment_id: formData.get('razorpay_payment_id'),
    nda: formData.get('nda') === 'Requested NDA',
    status: formData.get('razorpay_payment_id') ? 'Submitted' : 'Pending'
  };
  
  submissions.unshift(newSubmission);
  localStorage.setItem('userSubmissions', JSON.stringify(submissions));
  loadUserSubmissions(userEmail);
}

// Policy Viewer
function showPolicy(id) {
  const sections = document.querySelectorAll('.policy-section');
  sections.forEach(section => section.classList.remove('active'));
  const policyToShow = document.getElementById(id);
  if (policyToShow) {
    policyToShow.classList.add('active');
    const policyContainer = document.querySelector('.policy-container');
    if (policyContainer) {
      window.scrollTo({ top: policyContainer.offsetTop - 20, behavior: 'smooth' });
    }
  }
}

// Initialize default policy view
window.addEventListener('DOMContentLoaded', () => {
  // Only show policy if it's in the URL hash
  const hash = window.location.hash.substring(1);
  if (hash && ['privacy', 'terms', 'refund', 'shipping'].includes(hash)) {
    setTimeout(() => {
      showPolicy(hash);
    }, 500);
  }
});

// Prevent access to other content if not signed in
document.addEventListener('click', function(e) {
  if (!document.body.classList.contains('signed-in') && 
      !e.target.closest('#signin-modal') && 
      e.target.id !== 'sign-out' &&
      !e.target.closest('.g_id_signin')) {
    e.preventDefault();
    e.stopPropagation();
    Swal.fire({
      title: 'Sign In Required',
      text: 'You must sign in with Google to access this content',
      icon: 'warning'
    });
  }
});