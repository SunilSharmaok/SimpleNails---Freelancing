document.addEventListener("DOMContentLoaded", () => {
    // Animation for Images and Subtitles
    const images = document.querySelectorAll(".image-container img");
    const demoTitles = document.querySelectorAll(".subtitle2, .subtitle3"); // Select both subtitles

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, {
        threshold: 0.2 // Adjust this value if needed
    });

    // Observe all images and both subtitles
    images.forEach(image => observer.observe(image));
    demoTitles.forEach(title => observer.observe(title)); // Observe both subtitles

    // Quick Start Page Toggle
    const quickStartLink = document.getElementById('quickStartLink');
    const quickStartPage = document.getElementById('quickStartPage');
    const closeBtn = document.querySelector('.close-btn');

    if (quickStartLink && quickStartPage) {
        quickStartLink.addEventListener('click', (e) => {
            e.preventDefault();
            quickStartPage.style.display = 'block';
        });
    }

    if (closeBtn && quickStartPage) {
        closeBtn.addEventListener('click', () => {
            quickStartPage.style.display = 'none';
        });
    }

    // File Upload Handling
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.querySelector('input[type="file"]');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', handleFiles);

        ['dragover', 'dragenter'].forEach(event => {
            dropZone.addEventListener(event, (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'dragend', 'drop'].forEach(event => {
            dropZone.addEventListener(event, (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
        });
    }

    function handleFiles(files) {
        console.log('Files uploaded:', files);
        // Add file handling logic here
    }

    // Form Submission
    const form = document.getElementById('editingRequestForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Request submitted successfully!');
            quickStartPage.style.display = 'none';
        });
    }

    // Style Selection
    document.querySelectorAll('.style-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.style-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });
});
      // Form Handling
      const form = document.getElementById('editingRequestForm');
      const quickStartPage = document.getElementById('quickStartPage');
      const closeBtn = document.querySelector('.close-btn');

      // Open modal
      document.getElementById('quickStartLink').addEventListener('click', (e) => {
          e.preventDefault();
          quickStartPage.style.display = 'block';
      });

      // Close modal
      closeBtn.addEventListener('click', () => {
          quickStartPage.style.display = 'none';
      });

      // Form submission
      form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          
          try {
              const response = await fetch(form.action, {
                  method: 'POST',
                  body: formData,
                  headers: {
                      'Accept': 'application/json'
                  }
              });

              if (response.ok) {
                  alert('Request submitted successfully!');
                  form.reset();
                  quickStartPage.style.display = 'none';
              } else {
                  alert('Error submitting request. Please try again.');
              }
          } catch (error) {
              alert('Network error. Please check your connection.');
          }
      });

      // Drag & drop functionality
      const dropZone = document.getElementById('dropZone');
      
      dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.style.borderColor = '#4CAF50';
      });

      dropZone.addEventListener('dragleave', () => {
          dropZone.style.borderColor = '#ccc';
      });

      dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.style.borderColor = '#ccc';
          const files = e.dataTransfer.files;
          document.querySelector('input[type="file"]').files = files;
      });


























   











