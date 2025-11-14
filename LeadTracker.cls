public with sharing class LeadTracker {

    /**
     * @description Retrieves all Leads for the current user's organization.
     * @return List<Lead> A list of Lead records.
     */
    @AuraEnabled(cacheable=true)
    public static List<Lead> getLeads() {
        // Query fields needed for the list view and update operations
        return [
            SELECT Id, Name, Email, Status, Company, AnnualRevenue
            FROM Lead
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];
    }

    /**
     * @description Creates a new Lead record.
     * @param leadName The name of the client (mapped to Company field).
     * @param leadEmail The contact's email.
     * @param leadValue The deal value (mapped to AnnualRevenue field).
     * @param leadStatus The initial status.
     */
    @AuraEnabled
    public static Id createNewLead(String leadName, String leadEmail, Decimal leadValue, String leadStatus) {
        try {
            Lead newLead = new Lead(
                Company = leadName,          // Client Name (Company in standard Lead object)
                Email = leadEmail,
                Status = leadStatus,
                AnnualRevenue = leadValue,   // Deal Value
                LastName = 'Contact',        // Required field for Lead
                FirstName = 'New'            // Required field for Lead
            );
            insert newLead;
            return newLead.Id;
        } catch (DmlException e) {
            throw new AuraHandledException('Error creating lead: ' + e.getMessage());
        }
    }

    /**
     * @description Updates the status of an existing Lead.
     * @param leadId The ID of the Lead to update.
     * @param newStatus The new status value.
     */
    @AuraEnabled
    public static void updateLeadStatus(Id leadId, String newStatus) {
        try {
            Lead leadToUpdate = new Lead(
                Id = leadId,
                Status = newStatus
            );
            update leadToUpdate;
        } catch (DmlException e) {
            throw new AuraHandledException('Error updating lead status: ' + e.getMessage());
        }
    }

    /**
     * @description Deletes a Lead record.
     * @param leadId The ID of the Lead to delete.
     */
    @AuraEnabled
    public static void deleteLead(Id leadId) {
        try {
            delete [SELECT Id FROM Lead WHERE Id = :leadId];
        } catch (DmlException e) {
            throw new AuraHandledException('Error deleting lead: ' + e.getMessage());
        }
    }
}
