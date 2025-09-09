let currentTaskId = null;

function startTask(taskId) {
    if (confirm('Are you sure you want to start this task?')) {
        startTaskAPI(taskId);
    }
}

function showCompletionModal(taskId) {
    currentTaskId = taskId;
    const modal = new bootstrap.Modal(document.getElementById('completionModal'));
    modal.show();
}

function viewTaskDetails(taskId) {
    fetch(`/employee/get_task_details/${taskId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const taskData = data.task_data;
                const modal = document.getElementById('taskDetailsModal');
                const content = document.getElementById('taskDetailsContent');
                
                                content.innerHTML = `
                    <div class="row g-3">
                        <div class="col-md-12">
                            <h6 class="text-primary"><strong>Task Information</strong></h6>
                            <p><strong>Task Name:</strong> ${taskData.task_name}</p>
                            <p><strong>Status:</strong> <span class="badge bg-secondary">${taskData.status.charAt(0).toUpperCase() + taskData.status.slice(1).replace('_', ' ')}</span></p>
                            <p><strong>Assigned Date:</strong> ${taskData.assigned_date}</p>
                            <p><strong>Due Date:</strong> ${taskData.due_date || 'Not set'}</p>
                            <p><strong>Completion Days:</strong> ${taskData.completion_days || 'Not specified'}</p>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6 class="text-info"><i class="bi bi-building me-2"></i><strong>Land Information</strong></h6>
                            <div class="card border-info">
                                <div class="card-body p-3">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <p><strong>Land Name:</strong> ${taskData.land_name}</p>
                                            <p><strong>Location:</strong> ${taskData.land_details.village}, ${taskData.land_details.taluka}, ${taskData.land_details.district}</p>
                                            <p><strong>State:</strong> ${taskData.land_details.state}</p>
                                            <p><strong>Document Type:</strong> ${taskData.land_details.sata_prakar}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Total Area:</strong> ${taskData.land_details.total_area} sq m</p>
                                            <p><strong>Built-up Area:</strong> ${taskData.land_details.built_up_area || 'Not specified'} sq m</p>
                                            <p><strong>Unutilized Area:</strong> ${taskData.land_details.unutilized_area || 'Not specified'} sq m</p>
                                            <p><strong>Broker:</strong> ${taskData.land_details.broker_name || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6 class="text-warning"><i class="bi bi-calendar-event me-2"></i><strong>Important Dates & Numbers</strong></h6>
                            <div class="card border-warning">
                                <div class="card-body p-3">
                                    <div class="row g-3">
                                        <div class="col-md-3">
                                            <p><strong>Past Date:</strong> ${taskData.land_details.past_date ? new Date(taskData.land_details.past_date).toLocaleDateString('en-IN') : 'Not set'}</p>
                                            <p><strong>Soda Tarikh:</strong> ${taskData.land_details.soda_tarikh ? new Date(taskData.land_details.soda_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                                        </div>
                                        <div class="col-md-3">
                                            <p><strong>Banakhat Tarikh:</strong> ${taskData.land_details.banakhat_tarikh ? new Date(taskData.land_details.banakhat_tarikh).toLocaleDateString('en-IN') : 'Not set'}</span></p>
                                            <p><strong>Dastavej Tarikh:</strong> ${taskData.land_details.dastavej_tarikh ? new Date(taskData.land_details.dastavej_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                                        </div>
                                        <div class="col-md-3">
                                            <p><strong>Old SR No:</strong> ${taskData.land_details.old_sr_no || 'Not specified'}</p>
                                            <p><strong>New SR No:</strong> ${taskData.land_details.new_sr_no || 'Not specified'}</p>
                                        </div>
                                        <div class="col-md-3">
                                            <p><strong>Land ID:</strong> ${taskData.land_id || 'N/A'}</p>
                                            <p><strong>Document Type:</strong> ${taskData.land_details.sata_prakar}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${taskData.admin_approval_notes ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6 class="text-info">Admin Notes</h6>
                            <div class="alert alert-info border">
                                <i class="bi bi-info-circle me-2"></i>
                                ${taskData.admin_approval_notes}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                `;
                
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching task details');
        });
}

// Handle completion form submission
document.addEventListener('DOMContentLoaded', function() {
    const completionForm = document.getElementById('completionForm');
    if (completionForm) {
        completionForm.addEventListener('submit', function(e) {
                e.preventDefault();
            if (currentTaskId) {
                submitTaskCompletion(currentTaskId);
            }
        });
    }
    
    // File preview functionality
    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('change', function(e) {
            const files = e.target.files;
            const preview = document.getElementById('photoPreview');
            const previewRow = document.getElementById('photoPreviewRow');
            
            if (files.length > 0) {
                preview.classList.remove('d-none');
                previewRow.innerHTML = '';
                
                // Limit to 5 photos
                const maxFiles = Math.min(files.length, 5);
                
                for (let i = 0; i < maxFiles; i++) {
                    const file = files[i];
                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        alert(`Photo ${file.name} is too large. Maximum size is 5MB.`);
                        continue;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const col = document.createElement('div');
                        col.className = 'col-4';
                        col.innerHTML = `
                            <div class="position-relative">
                                <img src="${e.target.result}" class="img-fluid rounded" style="width: 100%; height: 80px; object-fit: cover;">
                                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" onclick="removePhoto(${i})" style="font-size: 10px; padding: 2px 4px;">
                                    <i class="bi bi-x"></i>
                                </button>
            </div>
        `;
                        previewRow.appendChild(col);
                    };
                    reader.readAsDataURL(file);
                }
            } else {
                preview.classList.add('d-none');
            }
        });
    }
    
    const documentUpload = document.getElementById('documentUpload');
    if (documentUpload) {
        documentUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('documentPreview');
            const documentName = document.getElementById('documentName');
            
            if (file) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    alert('Document is too large. Maximum size is 10MB.');
                    this.value = '';
                    return;
                }
                
                preview.classList.remove('d-none');
                documentName.textContent = file.name;
            } else {
                preview.classList.add('d-none');
            }
        });
    }
    
    // Form validation
    if (completionForm) {
        completionForm.addEventListener('submit', function(e) {
            const notes = document.querySelector('textarea[name="notes"]').value.trim();
            const photos = document.getElementById('photoUpload').files;
            const pdf = document.getElementById('pdf').files;
            
            if (!notes) {
                e.preventDefault();
                alert('Please provide completion notes.');
                return;
            }
            
            if (photos.length > 5) {
                e.preventDefault();
                alert('Maximum 5 photos allowed.');
                return;
            }
            
            // Check file sizes
            for (let photo of photos) {
                if (photo.size > 5 * 1024 * 1024) {
                    e.preventDefault();
                    alert(`Photo ${photo.name} is too large. Maximum size is 5MB.`);
                    return;
                }
            }
            
            if (pdf.length > 0 && pdf[0].size > 10 * 1024 * 1024) {
                e.preventDefault();
                alert('Document is too large. Maximum size is 10MB.');
                return;
            }
            
            // Disable submit button to prevent double submission
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
            }
        });
    }
    
    // Auto-submit form when filters change
    const statusFilter = document.getElementById('status');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            this.form.submit();
        });
    }
});

// API functions
async function startTaskAPI(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/start/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Task started successfully!');
            location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to start task. Please try again.');
    }
}

async function submitTaskCompletion(taskId) {
    try {
        const formData = new FormData(document.getElementById('completionForm'));
        
        const response = await fetch(`/api/tasks/${taskId}/submit-completion/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Task completion submitted for approval!');
            bootstrap.Modal.getInstance(document.getElementById('completionModal')).hide();
            document.getElementById('completionForm').reset();
            location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit task completion. Please try again.');
    }
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

function removePhoto(index) {
    const input = document.getElementById('photoUpload');
    const dt = new DataTransfer();
    const { files } = input;
    
    for (let i = 0; i < files.length; i++) {
        if (i !== index) {
            dt.items.add(files[i]);
        }
    }
    
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
}
