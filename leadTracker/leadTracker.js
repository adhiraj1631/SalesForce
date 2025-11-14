import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getLeads from '@salesforce/apex/LeadTracker.getLeads';
import createNewLead from '@salesforce/apex/LeadTracker.createNewLead';
import updateLeadStatus from '@salesforce/apex/LeadTracker.updateLeadStatus';
import deleteLead from '@salesforce/apex/LeadTracker.deleteLead';

// Status options for the combobox
const STATUS_OPTIONS = [
    { label: 'New Lead', value: 'New' },
    { label: 'Contacted', value: 'Contacted' },
    { label: 'Qualified', value: 'Qualified' },
    { label: 'Closed (Won)', value: 'Closed Won' }, // Using standard Lead values
    { label: 'Closed (Lost)', value: 'Closed Lost' }, // Using standard Lead values
];

// Columns configuration for the lightning-datatable
const ACTIONS = [
    { label: 'Delete', name: 'delete' },
];

const COLUMNS = [
    { label: 'Client', fieldName: 'Company', type: 'text', wrapText: true },
    { label: 'Email', fieldName: 'Email', type: 'email', wrapText: true },
    { label: 'Value', fieldName: 'AnnualRevenue', type: 'currency', typeAttributes: { currencyCode: 'USD' } },
    { 
        label: 'Status', 
        fieldName: 'Status', 
        type: 'button', 
        typeAttributes: { 
            label: { fieldName: 'Status' }, 
            variant: 'brand',
            title: 'Change Status',
            name: 'update_status'
        }
    },
    { type: 'action', typeAttributes: { rowActions: ACTIONS } }
];


export default class LeadTracker extends LightningElement {
    @track newLead = { 
        name: '', 
        email: '', 
        value: 0, 
        status: 'New' 
    };
    @track isAdding = false;
    @track buttonLabel = 'Add Lead';
    
    statusOptions = STATUS_OPTIONS;
    columns = COLUMNS;

    // Use the @wire adapter to call the Apex method and handle real-time data updates
    // This is Salesforce's equivalent of your Firebase onSnapshot listener
    @wire(getLeads)
    leads;

    // Handle input changes for the form
    handleInputChange(event) {
        let value = event.target.value;
        const name = event.target.name;

        if (name === 'value') {
            value = parseInt(value, 10);
        }

        this.newLead = { ...this.newLead, [name]: value };
    }

    // Handle the creation of a new lead
    async handleAddLead() {
        if (!this.template.querySelector('lightning-input').checkValidity()) {
            this.showToast('Error', 'Please fill out all required fields.', 'error');
            return;
        }

        this.isAdding = true;
        this.buttonLabel = 'Adding...';

        try {
            await createNewLead({
                leadName: this.newLead.name,
                leadEmail: this.newLead.email,
                leadValue: this.newLead.value,
                leadStatus: this.newLead.status
            });

            this.showToast('Success', 'Lead added successfully!', 'success');
            this.resetForm();

        } catch (error) {
            this.showToast('Error', error.body.message || 'An unknown error occurred.', 'error');
            console.error(error);
        } finally {
            this.isAdding = false;
            this.buttonLabel = 'Add Lead';
            // The @wire adapter automatically refreshes the lead list upon database change
        }
    }

    // Handle row actions (Delete) and Status update button clicks
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        switch (action.name) {
            case 'delete':
                this.handleDeleteLead(row.Id);
                break;
            case 'update_status':
                // For a simple example, we'll prompt the user for the next status
                this.promptForStatusChange(row.Id, row.Status);
                break;
            default:
        }
    }

    // Simple status change logic (you'd replace this with a real modal/dropdown in a production app)
    promptForStatusChange(leadId, currentStatus) {
        const newStatus = prompt(`Current Status: ${currentStatus}\nEnter new status (New, Contacted, Qualified, Closed Won, Closed Lost):`);
        
        if (newStatus && STATUS_OPTIONS.some(opt => opt.value === newStatus)) {
            this.handleStatusUpdate(leadId, newStatus);
        } else if (newStatus !== null) {
            this.showToast('Invalid Status', 'Please enter a valid status.', 'warning');
        }
    }


    // Handle the update of lead status
    async handleStatusUpdate(leadId, newStatus) {
        try {
            await updateLeadStatus({ leadId: leadId, newStatus: newStatus });
            this.showToast('Success', 'Lead status updated!', 'success');
        } catch (error) {
            this.showToast('Error', error.body.message || 'Failed to update status.', 'error');
            console.error(error);
        }
    }

    // Handle the deletion of a lead
    async handleDeleteLead(leadId) {
        if (confirm('Are you sure you want to delete this lead?')) {
            try {
                await deleteLead({ leadId: leadId });
                this.showToast('Success', 'Lead deleted successfully!', 'success');
            } catch (error) {
                this.showToast('Error', error.body.message || 'Failed to delete lead.', 'error');
                console.error(error);
            }
        }
    }

    // Utility to show a Salesforce Toast Notification
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    // Utility to reset the form data
    resetForm() {
        this.newLead = { 
            name: '', 
            email: '', 
            value: 0, 
            status: 'New' 
        };
        // Reset lightning-inputs visually by setting their value attributes
        const inputs = this.template.querySelectorAll('lightning-input');
        inputs.forEach(input => {
            if (input.name === 'value') {
                input.value = null; // Clear number input
            } else {
                input.value = '';
            }
        });
        this.template.querySelector('lightning-combobox').value = 'New';
    }
}
