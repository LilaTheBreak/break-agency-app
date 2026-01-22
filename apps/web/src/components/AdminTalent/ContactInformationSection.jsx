import React, { useState, useEffect } from "react";
import { Lock, Unlock, Eye, EyeOff, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiFetch } from "../../services/apiClient.js";

/**
 * ContactInformationSection Component
 * 
 * Comprehensive contact information and personal details management
 * Includes password-protected locked sections for sensitive data
 */
export function ContactInformationSection({ talent, isEditing = false }) {
  const [unlockedSections, setUnlockedSections] = useState({}); // Track which sections are unlocked
  const [passwordInput, setPasswordInput] = useState("");
  const [lockingPassword, setLockingPassword] = useState(null); // Which section's password is being entered
  const [showPassword, setShowPassword] = useState(false);
  
  // Personal Details
  const [personalDetails, setPersonalDetails] = useState(null);
  const [showSensitiveFields, setShowSensitiveFields] = useState({});
  
  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateCounty: "",
    postcode: "",
    country: "",
    isPrimary: false,
    isShippingAddress: false,
    notes: "",
  });
  
  // Banking Details
  const [bankingDetails, setBankingDetails] = useState(null);
  
  // Tax Compliance
  const [taxCompliance, setTaxCompliance] = useState(null);
  
  // Travel Info
  const [travelInfo, setTravelInfo] = useState(null);
  
  // Brand Preferences
  const [brandPreferences, setBrandPreferences] = useState(null);
  
  // Measurements
  const [measurements, setMeasurements] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal"); // personal | addresses | banking | tax | travel | brands | measurements

  // Load all data on mount and when talent changes
  useEffect(() => {
    if (talent?.id) {
      loadAllData();
    }
  }, [talent?.id, isEditing]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        personalRes,
        addressesRes,
        bankingRes,
        taxRes,
        travelRes,
        brandsRes,
        measurementsRes,
      ] = await Promise.all([
        apiFetch(`/api/admin/talent/${talent.id}/personal-details`),
        apiFetch(`/api/admin/talent/${talent.id}/addresses`),
        apiFetch(`/api/admin/talent/${talent.id}/banking-details`),
        apiFetch(`/api/admin/talent/${talent.id}/tax-compliance`),
        apiFetch(`/api/admin/talent/${talent.id}/travel-info`),
        apiFetch(`/api/admin/talent/${talent.id}/brand-preferences`),
        apiFetch(`/api/admin/talent/${talent.id}/measurements`),
      ]);

      if (personalRes.ok) {
        const data = await personalRes.json();
        setPersonalDetails(data.data || {});
      }
      if (addressesRes.ok) {
        const data = await addressesRes.json();
        setAddresses(data.data?.addresses || []);
      }
      if (bankingRes.ok) {
        const data = await bankingRes.json();
        setBankingDetails(data.data || {});
      }
      if (taxRes.ok) {
        const data = await taxRes.json();
        setTaxCompliance(data.data || {});
      }
      if (travelRes.ok) {
        const data = await travelRes.json();
        setTravelInfo(data.data || {});
      }
      if (brandsRes.ok) {
        const data = await brandsRes.json();
        setBrandPreferences(data.data || {});
      }
      if (measurementsRes.ok) {
        const data = await measurementsRes.json();
        setMeasurements(data.data || {});
      }
    } catch (error) {
      console.error("Error loading contact information:", error);
      toast.error("Failed to load contact information");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (sectionName) => {
    // TODO: Verify password with backend
    // For now, simple client-side check
    if (passwordInput === "123456") {
      setUnlockedSections({ ...unlockedSections, [sectionName]: true });
      setPasswordInput("");
      setLockingPassword(null);
      toast.success(`${sectionName} unlocked`);
    } else {
      toast.error("Incorrect password");
    }
  };

  const lockSection = (sectionName) => {
    setUnlockedSections({ ...unlockedSections, [sectionName]: false });
    setPasswordInput("");
    setLockingPassword(null);
  };

  const toggleSensitiveFieldVisibility = (fieldName) => {
    setShowSensitiveFields({
      ...showSensitiveFields,
      [fieldName]: !showSensitiveFields[fieldName],
    });
  };

  const maskSensitiveValue = (value, fieldName) => {
    if (!value) return "Not set";
    if (showSensitiveFields[fieldName]) {
      return value;
    }
    if (value === "****") return "****";
    // Show last 4 digits
    const str = String(value);
    if (str.length <= 4) return "****";
    return `****${str.slice(-4)}`;
  };

  // ============================================================
  // LOCKED SECTION PASSWORD COMPONENT
  // ============================================================
  const LockedSection = ({ name, isUnlocked, children }) => {
    if (isUnlocked) {
      return (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-brand-black">{name}</h3>
              <span className="text-xs text-green-600 font-medium">UNLOCKED</span>
            </div>
            <button
              onClick={() => lockSection(name)}
              className="px-3 py-1 text-xs rounded-lg border border-brand-black/20 hover:bg-brand-black/5"
            >
              Lock
            </button>
          </div>
          {children}
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-brand-red" />
          <h3 className="font-semibold text-brand-red">{name}</h3>
          <span className="text-xs text-brand-red font-medium">LOCKED</span>
        </div>

        {lockingPassword === name ? (
          <div className="space-y-3 max-w-sm">
            <p className="text-sm text-brand-black/70">
              Enter admin password to unlock this section
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 pr-10 rounded-lg border border-brand-black/10 text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") handlePasswordSubmit(name);
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/50 hover:text-brand-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePasswordSubmit(name)}
                className="flex-1 px-4 py-2 bg-brand-red text-white text-sm rounded-lg hover:bg-brand-red/90"
              >
                Unlock
              </button>
              <button
                onClick={() => {
                  setLockingPassword(null);
                  setPasswordInput("");
                }}
                className="px-4 py-2 border border-brand-black/20 text-sm rounded-lg hover:bg-brand-black/5"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLockingPassword(name)}
            className="px-4 py-2 bg-brand-red text-white text-sm rounded-lg hover:bg-brand-red/90"
          >
            Unlock Section
          </button>
        )}
      </div>
    );
  };

  // ============================================================
  // SECTION 1: PERSONAL DETAILS
  // ============================================================
  const PersonalDetailsTab = () => (
    <LockedSection name="Personal Details" isUnlocked={unlockedSections["Personal Details"]}>
      <div className="grid grid-cols-2 gap-4">
        {/* Legal Names */}
        <FormField
          label="Legal First Name"
          value={personalDetails?.legalFirstName}
          onChange={(val) => setPersonalDetails({ ...personalDetails, legalFirstName: val })}
          disabled={!isEditing}
        />
        <FormField
          label="Legal Last Name"
          value={personalDetails?.legalLastName}
          onChange={(val) => setPersonalDetails({ ...personalDetails, legalLastName: val })}
          disabled={!isEditing}
        />

        {/* Preferred Name */}
        <div className="col-span-2">
          <FormField
            label="Preferred / Professional Name"
            value={personalDetails?.preferredName}
            onChange={(val) => setPersonalDetails({ ...personalDetails, preferredName: val })}
            disabled={!isEditing}
          />
        </div>

        {/* Date of Birth */}
        <FormField
          label="Date of Birth"
          type="date"
          value={personalDetails?.dateOfBirth?.split("T")[0] || ""}
          onChange={(val) => setPersonalDetails({ ...personalDetails, dateOfBirth: val })}
          disabled={!isEditing}
        />

        {/* Nationality */}
        <FormField
          label="Nationality"
          value={personalDetails?.nationality}
          onChange={(val) => setPersonalDetails({ ...personalDetails, nationality: val })}
          disabled={!isEditing}
          placeholder="ISO country code"
        />

        {/* Countries */}
        <FormField
          label="Country of Residence"
          value={personalDetails?.countryOfResidence}
          onChange={(val) => setPersonalDetails({ ...personalDetails, countryOfResidence: val })}
          disabled={!isEditing}
          placeholder="ISO country code"
        />
        <FormField
          label="Tax Residency Country"
          value={personalDetails?.taxResidencyCountry}
          onChange={(val) => setPersonalDetails({ ...personalDetails, taxResidencyCountry: val })}
          disabled={!isEditing}
          placeholder="ISO country code"
        />

        {/* Government ID */}
        <FormField
          label="Government ID Type"
          type="select"
          value={personalDetails?.governmentIdType || ""}
          onChange={(val) => setPersonalDetails({ ...personalDetails, governmentIdType: val })}
          disabled={!isEditing}
          options={[
            { value: "PASSPORT", label: "Passport" },
            { value: "NATIONAL_ID", label: "National ID" },
            { value: "DRIVER_LICENCE", label: "Driver's Licence" },
          ]}
        />
        <FormField
          label="ID Expiry Date"
          type="date"
          value={personalDetails?.idExpiryDate?.split("T")[0] || ""}
          onChange={(val) => setPersonalDetails({ ...personalDetails, idExpiryDate: val })}
          disabled={!isEditing}
        />

        {/* Government ID Number (Sensitive) */}
        <div className="col-span-2">
          <SensitiveField
            label="Government ID Number"
            value={personalDetails?.governmentIdNumber}
            fieldName="govIdNumber"
            showSensitive={showSensitiveFields["govIdNumber"]}
            onToggleVisibility={() => toggleSensitiveFieldVisibility("govIdNumber")}
            onChange={(val) => setPersonalDetails({ ...personalDetails, governmentIdNumber: val })}
            disabled={!isEditing}
          />
        </div>

        {/* Contact Information */}
        <FormField
          label="Primary Email ⭐"
          type="email"
          value={personalDetails?.primaryEmail || talent?.primaryEmail}
          onChange={(val) => setPersonalDetails({ ...personalDetails, primaryEmail: val })}
          disabled={!isEditing}
        />
        <FormField
          label="Secondary Email"
          type="email"
          value={personalDetails?.secondaryEmail}
          onChange={(val) => setPersonalDetails({ ...personalDetails, secondaryEmail: val })}
          disabled={!isEditing}
        />

        {/* Phone Numbers (Sensitive) */}
        <SensitiveField
          label="Mobile Phone Number ⭐"
          value={personalDetails?.mobilePhoneNumber}
          fieldName="mobile"
          showSensitive={showSensitiveFields["mobile"]}
          onToggleVisibility={() => toggleSensitiveFieldVisibility("mobile")}
          onChange={(val) => setPersonalDetails({ ...personalDetails, mobilePhoneNumber: val })}
          disabled={!isEditing}
        />
        <SensitiveField
          label="WhatsApp Number"
          value={personalDetails?.whatsappNumber}
          fieldName="whatsapp"
          showSensitive={showSensitiveFields["whatsapp"]}
          onToggleVisibility={() => toggleSensitiveFieldVisibility("whatsapp")}
          onChange={(val) => setPersonalDetails({ ...personalDetails, whatsappNumber: val })}
          disabled={!isEditing}
        />

        {/* Emergency Contact */}
        <FormField
          label="Emergency Contact Name"
          value={personalDetails?.emergencyContactName}
          onChange={(val) => setPersonalDetails({ ...personalDetails, emergencyContactName: val })}
          disabled={!isEditing}
        />
        <FormField
          label="Emergency Contact Relationship"
          value={personalDetails?.emergencyContactRelationship}
          onChange={(val) => setPersonalDetails({ ...personalDetails, emergencyContactRelationship: val })}
          disabled={!isEditing}
        />
        <SensitiveField
          label="Emergency Contact Phone"
          value={personalDetails?.emergencyContactPhone}
          fieldName="emergencyPhone"
          showSensitive={showSensitiveFields["emergencyPhone"]}
          onToggleVisibility={() => toggleSensitiveFieldVisibility("emergencyPhone")}
          onChange={(val) => setPersonalDetails({ ...personalDetails, emergencyContactPhone: val })}
          disabled={!isEditing}
        />
      </div>

      {isEditing && (
        <div className="mt-6 pt-6 border-t border-brand-black/10">
          <button
            onClick={() => handleSaveSection("personal")}
            disabled={saving}
            className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Personal Details"}
          </button>
        </div>
      )}
    </LockedSection>
  );

  // ============================================================
  // SECTION 2: ADDRESSES
  // ============================================================
  const AddressesTab = () => (
    <div className="space-y-4">
      {/* Addresses List */}
      {addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-brand-black">{address.label}</h4>
                    {address.isPrimary && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        PRIMARY
                      </span>
                    )}
                    {address.isShippingAddress && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        SHIPPING
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-brand-black/70">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </p>
                  <p className="text-sm text-brand-black/70">
                    {address.city}
                    {address.stateCounty && `, ${address.stateCounty}`}
                    {address.postcode && ` ${address.postcode}`}
                  </p>
                  <p className="text-sm text-brand-black/70">{address.country}</p>
                  {address.notes && (
                    <p className="text-xs text-brand-black/50 mt-2 italic">
                      {address.notes}
                    </p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="px-3 py-1 text-xs rounded-lg border border-brand-black/20 hover:bg-brand-black/5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="px-3 py-1 text-xs text-brand-red rounded-lg border border-brand-red/20 hover:bg-brand-red/5"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Form */}
      {isEditing && !showAddressForm && addresses.length === 0 && (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-black/5 p-6">
          <p className="text-sm text-brand-black/70 mb-4">
            No addresses added yet. Add at least one primary address for contracts and shipping.
          </p>
          <button
            onClick={() => {
              setShowAddressForm(true);
              setEditingAddressId(null);
              setAddressForm({
                label: "Home",
                addressLine1: "",
                addressLine2: "",
                city: "",
                stateCounty: "",
                postcode: "",
                country: "",
                isPrimary: true,
                isShippingAddress: false,
                notes: "",
              });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>
      )}

      {/* Add/Edit Address Form */}
      {isEditing && showAddressForm && (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-6">
          <h4 className="font-semibold text-brand-black mb-4">
            {editingAddressId ? "Edit Address" : "New Address"}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Address Label"
              type="select"
              value={addressForm.label}
              onChange={(val) => setAddressForm({ ...addressForm, label: val })}
              options={[
                { value: "Home", label: "Home" },
                { value: "Business", label: "Business" },
                { value: "Shipping", label: "Shipping" },
                { value: "Temporary", label: "Temporary" },
              ]}
            />

            <FormField
              label="Country ⭐"
              value={addressForm.country}
              onChange={(val) => setAddressForm({ ...addressForm, country: val })}
              placeholder="Country name or code"
            />

            <div className="col-span-2">
              <FormField
                label="Address Line 1 ⭐"
                value={addressForm.addressLine1}
                onChange={(val) => setAddressForm({ ...addressForm, addressLine1: val })}
              />
            </div>

            <div className="col-span-2">
              <FormField
                label="Address Line 2"
                value={addressForm.addressLine2}
                onChange={(val) => setAddressForm({ ...addressForm, addressLine2: val })}
              />
            </div>

            <FormField
              label="City ⭐"
              value={addressForm.city}
              onChange={(val) => setAddressForm({ ...addressForm, city: val })}
            />

            <FormField
              label="State / County"
              value={addressForm.stateCounty}
              onChange={(val) => setAddressForm({ ...addressForm, stateCounty: val })}
            />

            <FormField
              label="Postcode / ZIP"
              value={addressForm.postcode}
              onChange={(val) => setAddressForm({ ...addressForm, postcode: val })}
            />

            <div className="col-span-2">
              <FormField
                label="Notes (access instructions, etc)"
                value={addressForm.notes}
                onChange={(val) => setAddressForm({ ...addressForm, notes: val })}
                type="textarea"
                rows={3}
              />
            </div>

            {/* Checkboxes */}
            <div className="col-span-2 space-y-2 border-t border-brand-black/10 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isPrimary}
                  onChange={(e) => setAddressForm({ ...addressForm, isPrimary: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-brand-black">Set as Primary Address ⭐</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isShippingAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, isShippingAddress: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-brand-black">Use for Shipping</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => handleSaveAddress()}
              disabled={!addressForm.addressLine1 || !addressForm.city || !addressForm.country}
              className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
            >
              {editingAddressId ? "Update Address" : "Add Address"}
            </button>
            <button
              onClick={() => {
                setShowAddressForm(false);
                setEditingAddressId(null);
              }}
              className="px-4 py-2 border border-brand-black/20 rounded-lg hover:bg-brand-black/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditing && !showAddressForm && addresses.length > 0 && (
        <button
          onClick={() => {
            setShowAddressForm(true);
            setEditingAddressId(null);
            setAddressForm({
              label: "Home",
              addressLine1: "",
              addressLine2: "",
              city: "",
              stateCounty: "",
              postcode: "",
              country: "",
              isPrimary: false,
              isShippingAddress: false,
              notes: "",
            });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-brand-black/20 rounded-lg hover:bg-brand-black/5"
        >
          <Plus className="w-4 h-4" />
          Add Another Address
        </button>
      )}
    </div>
  );

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const handleSaveSection = async (section) => {
    setSaving(true);
    try {
      // Build the request body with proper data
      let requestBody = {};
      
      if (section === "personal") {
        requestBody = personalDetails;
      } else if (section === "addresses") {
        requestBody = { addresses };
      } else if (section === "banking") {
        requestBody = bankingDetails;
      } else if (section === "tax") {
        requestBody = taxCompliance;
      } else if (section === "travel") {
        requestBody = travelInfo;
      } else if (section === "brands") {
        requestBody = brandPreferences;
      } else if (section === "measurements") {
        requestBody = measurements;
      }

      const endpoint = `/api/admin/talent/${talent.id}/${
        section === "personal" 
          ? "personal-details" 
          : section === "addresses"
          ? "addresses"
          : section === "banking"
          ? "banking-details"
          : section === "tax"
          ? "tax-compliance"
          : section === "travel"
          ? "travel-info"
          : section === "brands"
          ? "brand-preferences"
          : section === "measurements"
          ? "measurements"
          : section
      }`;

      const response = await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success(`${section} details saved successfully`);
      
      // Reload all data to ensure UI is up to date with server state
      setTimeout(() => {
        loadAllData();
      }, 300);
      
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!addressForm.addressLine1 || !addressForm.city || !addressForm.country) {
        toast.error("Address Line 1, City, and Country are required");
        setSaving(false);
        return;
      }

      const url = editingAddressId
        ? `/api/admin/talent/${talent.id}/addresses/${editingAddressId}`
        : `/api/admin/talent/${talent.id}/addresses`;

      const response = await apiFetch(url, {
        method: editingAddressId ? "PUT" : "POST",
        body: JSON.stringify(addressForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save address");
      }

      toast.success(editingAddressId ? "Address updated successfully" : "Address added successfully");
      
      // Reset form
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({
        label: "Home",
        addressLine1: "",
        addressLine2: "",
        city: "",
        stateCounty: "",
        postcode: "",
        country: "",
        isPrimary: false,
        isShippingAddress: false,
        notes: "",
      });
      
      // Reload all data to sync with server
      setTimeout(() => {
        loadAllData();
      }, 300);
      
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm(address);
    setEditingAddressId(address.id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Delete this address? This cannot be undone.")) return;

    try {
      const response = await apiFetch(
        `/api/admin/talent/${talent.id}/addresses/${addressId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete");
      }

      toast.success("Address deleted successfully");
      
      // Reload all data to sync with server
      setTimeout(() => {
        loadAllData();
      }, 300);
      
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error.message || "Failed to delete address");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-black/10 border-t-brand-red rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-brand-black/60">Loading contact information...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER TABS
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Missing Info Alerts */}
      <MissingInfoAlert talent={talent} personalDetails={personalDetails} addresses={addresses} />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-brand-black/10">
        <TabButton
          active={activeTab === "personal"}
          onClick={() => setActiveTab("personal")}
          label="Personal Details"
        />
        <TabButton
          active={activeTab === "addresses"}
          onClick={() => setActiveTab("addresses")}
          label="Addresses"
        />
        <TabButton
          active={activeTab === "banking"}
          onClick={() => setActiveTab("banking")}
          label="Banking"
        />
        <TabButton
          active={activeTab === "tax"}
          onClick={() => setActiveTab("tax")}
          label="Tax"
        />
        <TabButton
          active={activeTab === "travel"}
          onClick={() => setActiveTab("travel")}
          label="Travel"
        />
        <TabButton
          active={activeTab === "brands"}
          onClick={() => setActiveTab("brands")}
          label="Brand Preferences"
        />
        <TabButton
          active={activeTab === "measurements"}
          onClick={() => setActiveTab("measurements")}
          label="Measurements"
        />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "personal" && <PersonalDetailsTab />}
        {activeTab === "addresses" && <AddressesTab />}
        {/* Other tabs will be similar */}
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function FormField({ label, type = "text", value, onChange, disabled, placeholder, options, rows }) {
  if (type === "select") {
    return (
      <div>
        <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
          {label}
        </label>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 rounded-xl border border-brand-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red disabled:bg-brand-black/5"
        >
          <option value="">Select {label}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div>
        <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
          {label}
        </label>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={rows || 3}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-brand-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red disabled:bg-brand-black/5"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-brand-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red disabled:bg-brand-black/5"
      />
    </div>
  );
}

function SensitiveField({ label, value, fieldName, showSensitive, onToggleVisibility, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
        {label} 🔒
      </label>
      <div className="flex gap-2">
        <input
          type={showSensitive ? "text" : "password"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-xl border border-brand-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red disabled:bg-brand-black/5"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="px-4 py-3 rounded-xl border border-brand-black/10 hover:bg-brand-black/5"
        >
          {showSensitive ? (
            <EyeOff className="w-4 h-4 text-brand-black/60" />
          ) : (
            <Eye className="w-4 h-4 text-brand-black/60" />
          )}
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-brand-red text-brand-black"
          : "border-transparent text-brand-black/60 hover:text-brand-black"
      }`}
    >
      {label}
    </button>
  );
}

function MissingInfoAlert({ talent, personalDetails, addresses }) {
  const missing = [];
  
  if (!personalDetails?.legalFirstName || !personalDetails?.legalLastName) {
    missing.push("Legal names");
  }
  if (addresses.length === 0) {
    missing.push("Primary address");
  }

  if (missing.length === 0) return null;

  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 flex gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-yellow-900 mb-1">Missing Required Information</p>
        <p className="text-sm text-yellow-800">
          Please complete: {missing.join(", ")}
        </p>
      </div>
    </div>
  );
}
