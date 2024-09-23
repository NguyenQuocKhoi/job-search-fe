import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './infoCompany.module.scss';

import { getApiWithToken, putApiWithToken } from '../../api';
import { getUserStorage } from '../../Utils/valid';

import logo from '../../images/logo.jpg';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const cities = [
  'TP.HCM', 'Hà Nội', 'Đà Nẵng', // Priority cities
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An',
  'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình',
  'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng',
  'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
  'Thừa Thiên - Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long',
  'Vĩnh Phúc', 'Yên Bái'
];

const InfoCompany = () => {
  const navigate = useNavigate();

  const [company, setCompany] = useState({
    avatar: '',
    name: '',
    email: '',
    phoneNumber: '',
    city: '',
    street: '',
    website: '',
    description: ''
  });
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  //city
  const [showCityModal, setShowCityModal] = useState(false);
  const [filteredCities, setFilteredCities] = useState(cities);
  const [searchQuery, setSearchQuery] = useState('');
  
  const companyId = getUserStorage().user._id;

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await getApiWithToken(`/company/${companyId}`);
        
        if (response.data.success) {
          setCompany(response.data.company);
          setAvatarPreview(response.data.company.avatarUrl);
        } else {
          setError('Failed to fetch company data');
        }
      } catch (err) {
        setError('An error occurred');
      }
    };

    fetchCompany();
  }, [companyId]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      const companyId = getUserStorage().user._id;
      const formData = new FormData();
      
      // Append form data for the company fields
      formData.append('name', company.name);
      formData.append('phoneNumber', company.phoneNumber);
      formData.append('city', company.city);
      formData.append('street', company.street);
      formData.append('website', company.website);
      formData.append('description', company.description);
      
      // Append avatar file if it exists
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const companyResponse = await putApiWithToken(`/company/update/${companyId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (companyResponse.data.success) {
        setCompany(companyResponse.data.company);
        setIsEditing(false);
        Swal.fire({ icon: 'success', text: 'Company information updated successfully!' });
      } else {
        setError('Failed to update company information');
        Swal.fire({ icon: 'error', text: 'Failed to update company information' });
      }
    } catch (err) {
      setError('An error occurred during information update');
      Swal.fire({ icon: 'error', text: 'An error occurred during information update' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompany({ ...company, [name]: value });
  };

  const handleViewEditProfile = () => {
    if (company.pendingUpdates) {
      navigate(`/viewEditProfile/${companyId}`);
    }
  };

  //city
  const handleCityInputClick = () => {
    setShowCityModal(true);
  };

  const handleCitySelect = (city) => {
    setCompany({ ...company, city });
    setShowCityModal(false);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredCities(cities.filter(city => city.toLowerCase().includes(query)));
  };

  if (error) return <div className={clsx(styles.error)}>{error}</div>;
  if (!company) return <div className={clsx(styles.loading)}>Loading...</div>;

  return (
    <div className={clsx(styles.companyInfo)}>
      <div className={clsx(styles.avatarSection)}>
        <img src={company.avatar || logo} alt="Avatar" className={clsx(styles.avatar)} />

        <input 
          type="file" 
          accept="image/*" 
          onChange={handleAvatarChange}
          disabled={!isEditing}
        />
      </div>

      <div className={clsx(styles.infoSection)}>
        <h2>Thông tin công ty</h2>

        <label>Name:</label>
        <input 
          type="text" 
          name="name"
          value={company.name || ""}
          onChange={handleInputChange}
          disabled={!isEditing}
        />

        <label>Email:</label>
        <input 
          type="email" 
          name="email"
          value={company.email || ""}
          onChange={handleInputChange}
          disabled
        />

        <label>Phone Number:</label>
        <input 
          type="text" 
          name="phoneNumber"
          value={company.phoneNumber || ""}
          onChange={handleInputChange}
          disabled={!isEditing}
        />

        <label>City:</label>
        <input 
          type="text" 
          name="city"
          value={company.city || ""}
          onClick={handleCityInputClick}
          readOnly
          disabled={!isEditing}
        />
        {/* City Modal */}
        {showCityModal && (
          <div className={clsx(styles.modal)}>
            <div className={clsx(styles.modalContent)}>
              <input 
                type="text"
                placeholder="Search Cities..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <ul>
                {filteredCities.map((city) => (
                  <li 
                    key={city}
                    onClick={() => handleCitySelect(city)}
                  >
                    {city}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowCityModal(false)}>Close</button>
            </div>
          </div>
        )}

        <label>Street:</label>
        <input 
          type="text" 
          name="street"
          value={company.street || ""}
          onChange={handleInputChange}
          disabled={!isEditing}
        />

        <label>Website:</label>
        <input 
          type="text" 
          name="website"
          value={company.website || ""}
          onChange={handleInputChange}
          disabled={!isEditing}
        />

        <label>Description:</label>
        <input 
          type="text" 
          name="description"
          value={company.description || ""}
          onChange={handleInputChange}
          disabled={!isEditing}
        />

        <div className={clsx(styles.btnContainer)}>
          {isEditing ? (
            <>
              <button className={clsx(styles.btnConfirm)} onClick={handleUpdateInfo}>
                Cập nhật
              </button>
              <button className={clsx(styles.btnCancel)} onClick={() => setIsEditing(false)}>
                Hủy
              </button>
            </>
          ) : (
            <button className={clsx(styles.btnEdit)} onClick={() => setIsEditing(true)}>
              Cập nhật thông tin
            </button>
          )}

          <button
            onClick={handleViewEditProfile}
            disabled={!company.pendingUpdates}
          >
            Profile đang chờ duyệt
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoCompany;
