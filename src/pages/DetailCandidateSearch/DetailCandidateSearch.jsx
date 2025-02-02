import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import clsx from 'clsx';
import styles from './detailCandidateSearch.module.scss';
import { deleteApiWithToken, getAPiNoneToken, getApiWithToken, postApiWithToken } from '../../api';
import logo from '../../images/logo.png';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserStorage } from '../../Utils/valid';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

const DetailCandidateSearch = () => {
  const { t, i18n } = useTranslation();

  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const [skills, setSkills] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCandidate = async () => {
      try {
        const companyId = getUserStorage().user._id;

        const result = await getApiWithToken(`/candidate/${candidateId}`);
        setCandidate(result.data.candidate);

        const candidateData = result.data.candidate;
        const skillPromises = candidateData.skill.map(skillId => 
          getAPiNoneToken(`/skill/${skillId}`)
        );
        
        const skillResponses = await Promise.all(skillPromises);
        const skillNames = skillResponses.map(res => res.data.skill.skillName);
        setSkills(skillNames);

        try {
          const savedCandidatesResponse = await getApiWithToken(`/save-candidate/gets/${companyId}`);
          const savedCandidates = savedCandidatesResponse?.data?.saveCandidate || [];
    
          const isSaved = savedCandidates.find(savedCandidate => 
            savedCandidate.candidate._id === candidateId && savedCandidate.company === companyId
          );
          if (isSaved) {
            setIsSaved(true); // Set the state if job is saved
          }
        } catch (savedCandidateError) {
          console.warn('No saved candidates found for company', savedCandidateError);
          // Optionally handle cases where there are no saved jobs
        }
      } catch (err) {
        setError('Failed to fetch candidate details');
      }
    };

    const userData = getUserStorage()?.user;
    const userRole = userData?.role;
    setUserRole(userRole);

    fetchCandidate();
  }, [candidateId]);

  useEffect(() => {
    if (candidate) {
      document.title = `Thông tin ứng viên - ${candidate.name}`;
    }
  }, [candidate]);

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: `/detail-candidate/${candidateId}` } });
  };

  const handleSaveCandidate = async () => {
    const userData = getUserStorage()?.user;
  
    if (!userData) {
      handleLoginRedirect();
      return;
    }
  
    let savedCandidates = [];
  
    try {
      // console.log("User data id:", userData._id);
  
      // Lấy danh sách công việc đã lưu
      const savedCandidatesResponse = await getApiWithToken(`/save-candidate/gets/${userData._id}`);
      savedCandidates = savedCandidatesResponse?.data?.saveCandidate || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách công việc đã lưu:", error);
      // Xử lý lỗi: Gán savedJobs thành mảng rỗng nếu không thể lấy được dữ liệu
      savedCandidates = [];
    }
  
    try {
      // console.log(candidate._id);
      // console.log(userData._id);
      
      // Kiểm tra xem công việc hiện tại đã được lưu chưa
      const savedCandidate = savedCandidates.find(savedCandidate => 
        savedCandidate.candidate._id === candidate._id && savedCandidate.company === userData._id
      );
      // console.log("Saved candidates:", savedCandidates);
      // console.log("Saved candidate:", savedCandidate);//chưa lưu thì undifined
  
      if (savedCandidate) {
        // Nếu công việc đã được lưu, thực hiện bỏ lưu
        await deleteApiWithToken(`/save-candidate/delete/${savedCandidate._id}`);
        setIsSaved(false);
        Swal.fire('Đã bỏ lưu ứng viên!', '', 'success');
      } else {
        // console.log(96);
        
        // Nếu công việc chưa được lưu, thực hiện lưu công việc
        await postApiWithToken(`/save-candidate/create`, { 
          candidateId: candidate._id,
          companyId: userData._id
        });
        setIsSaved(true);
        Swal.fire('Lưu ứng viên thành công!', '', 'success');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu ứng viên hoặc bỏ lưu ứng viên', 'error');
    }
  } 

  if (error) return <div>{error}</div>;
  if (!candidate) return <div>Loading...</div>;

  return (
    // <div className={clsx(styles.homePage)}>
    <div>
      <Header />
      <div className={clsx(styles.mainContent)}>
        <div className={clsx(styles.top)}>
          <img src={candidate.avatar || logo} alt="Avatar" className={clsx(styles.avatar)} />
          <div className={clsx(styles.topText)}>            
            <p><strong>{t('detailCandidate.name')}:</strong> {candidate.name}</p>
            <p><strong>Email:</strong> {candidate.email}</p>
            <p><strong>{t('detailCandidate.phoneNumber')}:</strong> {candidate.phoneNumber}</p>
            <p><strong>{t('detailCandidate.address')}:</strong> {candidate.address}</p>
            <p><strong>{t('detailCandidate.dob')}:</strong> {new Date(candidate.dateOfBirth).toLocaleDateString('vi-VN')}</p>
          
            {(userRole === 'company' ) && (
              <button 
              className={clsx(styles.button)}
              onClick={handleSaveCandidate}>
                  <i className={clsx(isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart')}></i>
                  <strong>{isSaved ? t('detailCandidate.unsave') : t('detailCandidate.saveCandidate')}</strong>
                </button>
              )
            }
            </div>
        </div>

        <div className={clsx(styles.bot)}>
          <div className={clsx(styles.botLeft)}>
            <p><strong>{t('detailCandidate.ex')}:</strong> {candidate.experience}</p>
            <p><strong>{t('detailCandidate.edu')}:</strong> {candidate.education}</p>
            {/* <p><strong>More Information:</strong> {candidate.moreInformation}</p> */}
            <p><strong>{t('detailCandidate.moreInfo')}:</strong></p>
            <div
              dangerouslySetInnerHTML={{ __html: candidate.moreInformation }}
            ></div>
            <p><strong>{t('detailCandidate.resume')}:</strong> <a href={candidate.resume} target="_blank" rel="noopener noreferrer">View CV</a></p>
          </div>

          <div className={clsx(styles.botRight)}>
            <strong>{t('detailCandidate.skill')}:</strong>
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <ul key={index}>
                    <li>
                    <span className={clsx(styles.skillTag)}>{skill}</span>
                    </li>
                  </ul>
                ))
              ) : (
                <p>{t('detailCandidate.noSkillAdded')}</p>
              )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DetailCandidateSearch;
