import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { deleteApiWithToken, getAPiNoneToken, getApiWithToken, postApiNoneToken, postApiWithToken, putApiWithToken } from '../../api';
import styles from './detailJob.module.scss';
import clsx from 'clsx';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { getUserStorage } from '../../Utils/valid';
import { Button, Form, Modal } from 'react-bootstrap';
import logo from '../../images/logo.png';

const JobDetail = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  // const [cvExists, setCvExists] = useState(false);//
  const navigate = useNavigate();
  const [isApplied, setIsApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [skills, setSkills] = useState([]);

  const [cvFile, setCvFile] = useState(null);

  // const [candidate, setCandidate] = useState({});
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');

  // const [fileName, setFileName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCvFile(file);
      // setFileName(file.name); // Lưu tên tệp vào state
    }
  };

  //Modal
  const [showModalNoneCV, setShowModalNoneCV] = useState(false);
  const [showModalCV, setShowModalCV] = useState(false);

  //khi đã có cv hiện modal có 2 option old, new
  const [selectedOption, setSelectedOption] = useState('option1');
  const [showNewCvFields, setShowNewCvFields] = useState(false);

  const [similarJobs, setSimilarJobs] = useState([]);

  const handleApplyWithExistingCvO1 = () => {
    setSelectedOption('option1');
    setShowNewCvFields(false); // Ẩn các trường input khi chọn CV cũ
  };

  const handleUploadNewCvO2 = () => {
    setSelectedOption('option2');
    setShowNewCvFields(true); // Hiển thị các trường input khi chọn CV mới
  };

  //khi chưa có cv hiện modal nhập mới
  const handleCloseModalNoneCV = () => {
    setShowModalNoneCV(false);
  };

  const handleCloseModalCV = () => {
    setShowModalCV(false);
  };

  useEffect(() => {
    // window.scrollTo(0, 0);

    const fetchCandidate = async () => {
      try {
        const candidateId = getUserStorage().user._id;
        // console.log(candidateId);
    
        // Fetch candidate data
        const response = await getApiWithToken(`/candidate/${candidateId}`);
        if (response.data.success) {
          setCandidateName(response.data.candidate.name);
          setCandidateEmail(response.data.candidate.email);
          setCandidatePhone(response.data.candidate.phoneNumber);
        } else {
          setError('Failed to fetch candidate data');
        }
    
        // Fetch application data
        try {
          const applicationResponse = await getApiWithToken(`/application/get-applications/${candidateId}`);
          const applications = applicationResponse?.data?.applications || [];

          // console.log(applications);
    
          const isApplied = applications.some(application => 
            application.candidate === candidateId && application.job === jobId
          );
          if (isApplied) {
            setIsApplied(true); // Set the state if already applied
          }
        } catch (applicationError) {
          console.warn('No applications found for candidate', applicationError);
          // Optionally handle cases where there are no applications
        }
    
        // Fetch saved jobs data
        try {
          const savedJobsResponse = await getApiWithToken(`/save-job/gets/${candidateId}`);
          const savedJobs = savedJobsResponse?.data?.savedJobs || [];
    
          const isSaved = savedJobs.find(savedJob => 
            savedJob.job._id === jobId && savedJob.candidate === candidateId
          );
          if (isSaved) {
            setIsSaved(true); // Set the state if job is saved
          }
        } catch (savedJobError) {
          console.warn('No saved jobs found for candidate', savedJobError);
          // Optionally handle cases where there are no saved jobs
        }
    
      } catch (err) {
        setError('An error occurred');
      }
    };
    
    const fetchJob = async () => {
      try {
        // console.log(1);
        // console.log(2);
        
        const result = await getAPiNoneToken(`/job/${jobId}`);
        if (result.data.job) {
          setJob(result.data.job);
          // console.log("job",result.data.job);
  
          const categoryId = result.data.job.category;
          if (categoryId) {
            const categoryResult = await getAPiNoneToken(`/category/${categoryId}`);
            
            // console.log(categoryResult.data.category.name);
            setCategoryName(categoryResult.data.category.name);
          } else {
            setCategoryName("Unknown Category");
          }

          // const skillPromises = result.data.job.requirements.map(async (skillId) => {
          //   const skillResult = await getAPiNoneToken(`/skill/${skillId}`);
          //   return skillResult.data.skill.skillName;
          // });
          
          // const fetchedSkills = await Promise.all(skillPromises);
          // setSkills(fetchedSkills);
          if (result.data.job.requirementSkills && result.data.job.requirementSkills.length > 0) {
            const skillPromises = result.data.job.requirementSkills.map(async (skillId) => {
              const skillResult = await getAPiNoneToken(`/skill/${skillId}`);
              return skillResult.data.skill.skillName;
            });

            const fetchedSkills = await Promise.all(skillPromises);
            setSkills(fetchedSkills);
          } else {
            setSkills([]); // Không có kỹ năng
          }

          const similarJobData = await postApiNoneToken('/job/get-similar', { jobId }, { params: { page: currentPage } });
          console.log(similarJobData);

          if (similarJobData.data.success && similarJobData.data.matchingJobs) {
            const jobsWithCompanyDetails = await Promise.all(
              similarJobData.data.matchingJobs.map(async (job) => {
                const companyResult = await getAPiNoneToken(`/company/${job.companyId}`);
                return {
                  ...job,
                  company: companyResult.data.company,
                };
              })
            );
            setSimilarJobs(jobsWithCompanyDetails);
            setTotalPages(similarJobData.data.totalPages);
            console.log(similarJobData.data.totalPages);            
          } else {
            setSimilarJobs([]);
          }

        } else {
          setError('Job not found');
        }
      } catch (err) {
        setError('Failed to fetch job details');
      }
    };
    
    const userData = getUserStorage()?.user;
    const userRole = userData?.role;
    
    // fetchCandidate();
    if (userRole === 'candidate') {
      fetchCandidate();
    }
    
    fetchJob();
    // setUserRole(userData?.role);
    setUserRole(userRole);
    setUserId(userData?._id);
  }, [jobId, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: `/detailJob/${jobId}` } });
  };
  
  const handleApply = async () => {
    const userData = getUserStorage()?.user;

      if (!userData) {
        handleLoginRedirect();
        return;
      }
    
    try {
      const result = await getApiWithToken(`/candidate/${userId}`)
        if(result.data.candidate.resume === undefined){
          console.log("khong co cv");
          setShowModalNoneCV(true);
        }else {
          console.log("co cv roi"); 
          setShowModalCV(true);
        }
      }
     catch (error) {
      console.log(error);
      
    }
  };

  const handleApplyByNewCandidate = async () => {
    const candidateId = getUserStorage().user._id;
     try{
      const data = {
        name: candidateName,
        email: candidateEmail, 
        phoneNumber: candidatePhone,
       }
       const formData = new FormData();
       formData.append('resume', cvFile);
  
       await putApiWithToken(`/candidate/update/${candidateId}`, data);
       
       await putApiWithToken(`/candidate/upload-cv/${candidateId}`, formData);
       await postApiWithToken(`/application/create`, { 
          jobId: job._id,
          candidateId: candidateId,
        });
      Swal.fire('Ứng tuyển thành công!', '', 'success');
      setShowModalNoneCV(false);//
      setIsApplied(true);//
     }catch(error){
        console.log(error);
        
     }

  }

  //thực hiện option khi nhấn nút apply
  const handleCvOption = async () => {
    if (selectedOption === 'option1') {
      handleApplyWithExistingCv();
    } else if (selectedOption === 'option2') {
      handleUploadNewCv();
    }
  };

  const handleApplyWithExistingCv = async () => {
    try {
      await postApiWithToken(`/application/create`, { 
        jobId: job._id,
        candidateId: userId,
      });
      Swal.fire('Ứng tuyển thành công!', '', 'success');
      setIsApplied(true);
      setShowModalCV(false);
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể gửi đơn ứng tuyển', 'error');
    }
  };

  const handleUploadNewCv = async () => {
    const candidateId = getUserStorage().user._id;
     try{
      const data = {
        name: candidateName,
        email: candidateEmail, 
        phoneNumber: candidatePhone,
       }
      //  const formData = new FormData();
      //  formData.append('resume', cvFile);
  
       await putApiWithToken(`/candidate/update/${candidateId}`, data);
       
       const formData = new FormData();
       formData.append('resume', cvFile);
       formData.append('jobId', job._id);
       formData.append('candidateId', candidateId);
      
       await postApiWithToken(`/application/create-new`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
       })

       //  await putApiWithToken(`/candidate/upload-cv/${candidateId}`, formData);
      //  await postApiWithToken(`/application/create-new`, { 
      //     jobId: job._id,
      //     candidateId: candidateId,
      //   });

      Swal.fire('Ứng tuyển thành công!', '', 'success');
      setShowModalCV(false);
      setIsApplied(true);//
     }catch(error){
      console.log('Error during CV upload and application:', error);
      Swal.fire('Đã có lỗi xảy ra!', 'Vui lòng thử lại sau.', 'error');
        // console.log(error);  
     }
  };

  const handleSaveJob = async () => {
    const userData = getUserStorage()?.user;
  
    if (!userData) {
      handleLoginRedirect();
      return;
    }
  
    let savedJobs = [];
  
    try {
      console.log("User data id:", userData._id);
  
      // Lấy danh sách công việc đã lưu
      const savedJobsResponse = await getApiWithToken(`/save-job/gets/${userData._id}`);
      savedJobs = savedJobsResponse?.data?.savedJobs || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách công việc đã lưu:", error);
      // Xử lý lỗi: Gán savedJobs thành mảng rỗng nếu không thể lấy được dữ liệu
      savedJobs = [];
    }
  
    try {
      // Kiểm tra xem công việc hiện tại đã được lưu chưa
      const savedJob = savedJobs.find(savedJob => 
        savedJob.job._id === job._id && savedJob.candidate === userData._id
      );
      console.log("Saved jobs:", savedJobs);
      console.log("Saved job:", savedJob);//chưa lưu thì undifined
  
      if (savedJob) {
        // Nếu công việc đã được lưu, thực hiện bỏ lưu
        await deleteApiWithToken(`/save-job/delete/${savedJob._id}`);
        setIsSaved(false);
        Swal.fire('Đã bỏ lưu tin!', '', 'success');
      } else {
        // Nếu công việc chưa được lưu, thực hiện lưu công việc
        await postApiWithToken(`/save-job/create`, { 
          candidateId: userData._id,
          jobId: job._id
        });
        setIsSaved(true);
        Swal.fire('Lưu tin thành công!', '', 'success');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu tin hoặc bỏ lưu tin', 'error');
    }
  };

  const handleNavigateToJobByCategory = (event) => {
    event.preventDefault();
    
    const searchParams = {
      search: categoryName,
      // city: addressInput.trim() || '',
    };

    navigate('/search-job-result', { state: { searchParams } });
  }
  
  if (error) return <div>{error}</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <>
    {/* Modal handleApplyByNewCandidate*/}
    <Modal show={showModalNoneCV} onHide={handleCloseModalNoneCV}>
      <Modal.Header closeButton>
        <Modal.Title>Tải CV và điền thông tin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Name</p>
        <input 
          type="text"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)} 
          />
        <p>Mail</p>
        <input 
          type="text" 
          value={candidateEmail}
          disabled
          // onChange={(e) => setCandidateEmail(e.target.value)} 
        />
        <p>Phone</p>
        <input 
          type="text" 
          value={candidatePhone}
          onChange={(e) => setCandidatePhone(e.target.value)}
        />
        <input 
        type="file" 
        accept=".pdf" 
        onChange={handleFileChange}
      />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModalNoneCV}>
          Close
        </Button>
        <Button variant="secondary" onClick={handleApplyByNewCandidate}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
    {/* handleCvOption */}
    {/* Modal */}
    <Modal show={showModalCV} onHide={handleCloseModalCV}>
      <Modal.Header closeButton>
        <Modal.Title>Bạn muốn dùng CV cũ hay CV mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Check
          type="radio"
          id="option1"
          label="Old CV"
          name="options"
          value="option1"
          checked={selectedOption === 'option1'}
          onChange={handleApplyWithExistingCvO1}
        />
        <Form.Check
          type="radio"
          id="option2"
          label="New CV"
          name="options"
          value="option2"
          checked={selectedOption === 'option2'}
          onChange={handleUploadNewCvO2}
        />

        {showNewCvFields && (
          <div className="new-cv-fields">
            <Form.Group controlId="formCvName">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control
                type="text" 
                placeholder="Nhập tên hiển thị với NTD" 
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)} 
              />
            </Form.Group>

            <Form.Group controlId="formCvEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="text" 
                placeholder="Nhập email hiển thị với NTD" 
                value={candidateEmail}
                disabled  
              />
            </Form.Group>

            <Form.Group controlId="formCvPhoneNumber">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhập số điện thoại hiển thị với NTD" 
                value={candidatePhone}
                onChange={(e) => setCandidatePhone(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="formCv">
              <Form.Label>Chọn CV</Form.Label>
              <Form.Control 
                type="file" 
                accept='.pdf'
                onChange={handleFileChange}
              />
            </Form.Group>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModalCV}>
          Close
        </Button>
        <Button variant="primary" onClick={handleCvOption}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>

      <Header />
      <div className={clsx(styles.jobDetail)}>
        <div className={clsx(styles.columnOne)}>
          <div className={clsx(styles.titleContainer)}>
            <div className={clsx(styles.title)}>
              {/* <img src={job.company.avatar || logo} alt="Logo" className={clsx(styles.avatar)} /> */}
            <div className={clsx(styles.tenCV)}>
              <h1>{job.title}</h1>
            </div>
            </div>
            {(userRole === 'candidate' || !userRole) && (
              <div className={clsx(styles.title)}>
                <button 
                  className={clsx(styles.btn, { [styles.disabled]: isApplied })} 
                  onClick={handleApply} 
                  disabled={isApplied}
                  style={{ backgroundColor: isApplied ? 'gray' : '' }}
                >
                  {
                    isApplied ? (
                      <strong>Đã ứng tuyển</strong>
                    ): (
                      <>
                        <i className="fa-regular fa-paper-plane"></i>
                        <strong className={clsx(styles.utn)}>Ứng tuyển ngay</strong>
                      </>
                    )
                  }
                  {/* <strong>{isApplied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}</strong> */}
                </button>
                <button 
                  className={clsx(styles.btnSave)}
                  onClick={handleSaveJob}>
                  <i className={clsx(isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart')}></i>
                  <p><strong>{isSaved ? 'Bỏ lưu' : 'Lưu tin'}</strong></p>
                </button>
              </div>
            )}
            <div className={clsx(styles.ngang)}>
              <p><strong>Hạn nộp hồ sơ:</strong> {new Date(job.expiredAt).toLocaleDateString()}</p>
              <p><strong>Lương:</strong> {job.salary}</p>
              <p><strong>Vị trí làm việc:</strong> {job.position}</p>
            </div>
          </div>
        
          <div className={clsx(styles.thongtinchinh)}>
            <p><strong>Phúc lợi:</strong> {job.interest}</p>
            <p><strong>Mô tả:</strong></p>
            <div
              dangerouslySetInnerHTML={{ __html: job.description }}
              ></div>
            <p><strong>Yêu cầu:</strong> {job.requirements}</p>
            <p><strong>Ngày đăng:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
            <p><strong>Hạn nộp hồ sơ:</strong> {new Date(job.expiredAt).toLocaleDateString()}</p>
          </div>
          
          <div className={clsx(styles.vieclamlienquan)}>
            <p><strong>Việc làm liên quan</strong></p>
            
            <div className={clsx(styles.jobContainer)}>
              {similarJobs.length === 0 ? (
                <p>No jobs similar.</p>
              ) : (
                similarJobs
                  .filter((job) => job.jobId !== jobId)
                  .map((job) => (
                  <div key={job.jobId} className={clsx(styles.jobcard)}>
                    <Link to={`/detailCompany/${job.companyId}`} target="_blank" rel="noopener noreferrer">
                      <img src={job.company?.avatar || logo} alt="Logo" className={clsx(styles.avatar)} />
                    </Link>
                    <Link to={`/detailJob/${job.jobId}`} target="_blank" rel="noopener noreferrer" className={clsx(styles.linkJob)}>
                      <div className={clsx(styles.describe)}>
                        <p><strong>Job Title: {job.title || 'Loading...'}</strong></p>
                        <p>Company: {job.company?.name || 'Unknown Company'}</p>
                        <p>Address: {job.street}, {job.city}</p>
                        <p>Posted on: {new Date(job.expiredAt).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className={clsx(styles.pagination)}>
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                <i className="fa-solid fa-angle-left"></i>              
                {/* Previous */}
              </button>
              <span> {currentPage} / {totalPages} trang </span>
              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                <i className="fa-solid fa-angle-right"></i>              
                {/* Next */}
              </button>
            </div>
          </div>

      </div>

      <div className={clsx(styles.columnTwo)}>
        <div className={clsx(styles.companyContainer)}>
          <div className={clsx(styles.titleCongty)}>
            <img src={job.company.avatar || logo} alt="Logo" className={clsx(styles.avatar)} />
            <p>
              {/* <strong>Công ty:</strong>  */}
              <strong>{job.company.name}</strong>
            </p>
          </div>
            <p><strong>Địa chỉ:</strong> {job.street}, {job.city} </p>
        </div>

        <div className={clsx(styles.thongtinchung)}>
          <p><strong>Hình thức làm việc:</strong> {job.type}</p>
          <p><strong>Số lượng tuyển:</strong> {job.numberOfCruiment}</p>
          <p><strong>Kinh nghiệm:</strong> {job.experienceLevel}</p>
        </div>

        <div className={clsx(styles.them)}>
          <p><strong>Lĩnh vực: </strong>
          <Link onClick={handleNavigateToJobByCategory} target="_blank" rel="noopener noreferrer" className={clsx(styles.linkJob)}>
            {categoryName}
          </Link>
          </p>

          <div>
            <strong>Yêu cầu kỹ năng: </strong>
            {skills.length > 0 ? (
              <ul>
                {skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : (
              <span>No skill</span>
            )}
          </div>
        </div>
      </div>

      </div>
      <Footer />
    </>
  );
};

export default JobDetail;

