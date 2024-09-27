import React, { useState, useEffect, useContext, useRef } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { RxCross2 } from 'react-icons/rx';
import { AuthContext } from './Authentication/AuthContext';
import { useSwipeable } from 'react-swipeable';
import PoleLoader from './Loaders/PoleLoader';
import { SlCloudUpload } from 'react-icons/sl';
import { Collapse } from '@material-tailwind/react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../index.css';
import { getButtonStyle } from './Styles/Styles';
import { useTouch } from '../Context/TouchScreenContext';
import BarLoader from './Loaders/BarLoader';
import HeadingTextAlt from './Styles/HeadingTextAlt';
import baseUrl from './Config';
import { MdOutlineNavigateNext } from "react-icons/md";

const Gallery = () => {
  const ASPECT_RATIO = 1;
  const MIN_DIMENSION = 150;
  const isTouchScreen = useTouch();
  const { isBarber, isAdmin } = useContext(AuthContext);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [openCollapse, setOpenCollapse] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef(null);
  const croppedBlobRef = useRef(null);
  const imagesPerPage = 12;
  const timeoutRef = useRef(null);
  const [fetchImageSuccess, setFetchImageSuccess] = useState(null);

  const fetchImages = async (reload = false) => {
    const handleResult = (success) => {
      setTimeout(() => {
        setFetchImageSuccess(success);
        setIsLoading(false);
      }, 1000);
    };

    try {
      if (reload) { setIsLoading(true); setFetchImageSuccess(null); }

      const getImages = await fetch(`${baseUrl}/api/Files/List`);
      const getImagesResponse = await getImages.json();

      if (timeoutRef.current) { clearTimeout(timeoutRef.current); }

      let simulateFail = false; // Simulate backend fail
      if (simulateFail) {
        console.error('Failed to fetch images:', "Simulated error message");
        handleResult(false);
      } else if (getImages.ok) {
        setImages(getImagesResponse.$values);
        handleResult(true);
      } else {
        console.error('Failed to fetch images:', getImagesResponse.message);
        handleResult(false);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      handleResult(false);
    } finally {
      timeoutRef.current = setTimeout(() => {
        setUploadMessage('');
      }, 2000);
    }
  };

  useEffect(() => {
    fetchImages();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);
  const totalPages = Math.ceil(images.length / imagesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index + (12 * (currentPage - 1)));
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const onSelectFile = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setUploadMessage('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || '';
      imageElement.src = imageUrl;

      imageElement.addEventListener('load', (e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          setUploadMessage('Image must be at least 150 x 150 pixels.');
          setFile(null);
          setPreview(null);
          setCompletedCrop(null);
          setIsCropping(false);
          return setPreview('');
        }
        setUploadMessage('');
      });
      setPreview(imageUrl);
      setFile(selectedFile);
      setIsCropping(true);
    });
    reader.readAsDataURL(selectedFile);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    const crop = makeAspectCrop(
      {
        unit: '%',
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);
    setCrop(centeredCrop);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setCompletedCrop(null);
    setIsCropping(false);
    setUploadMessage('');
  };

  const handleSaveCrop = () => {
    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      const previewUrl = URL.createObjectURL(blob);
      setPreview(previewUrl);
      setIsCropping(false);
      croppedBlobRef.current = blob;
    }, 'image/jpeg', 0.9);
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const handleUpload = async (e) => {
    setUploadingImage(true);
    setUploadMessage('');
    e.preventDefault();
    if (!completedCrop || !file) {
      setUploadMessage('Please select a file to upload and crop it.');
      return;
    }

    const formData = new FormData();
    formData.append('file', croppedBlobRef.current, file.name);

    try {
      const uploadFile = await fetch(`${baseUrl}/api/Files/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (uploadFile.ok) {
        setTimeout(() => {
          setUploadMessage('');
          setFile(null);
          setPreview(null);
          setCompletedCrop(null);
          setUploadingImage(false);
          fetchImages(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setUploadMessage(`Failed to upload image`);
          setUploadingImage(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setTimeout(() => {
        setUploadMessage('Unable to connect to the server');
        setUploadingImage(false);
      }, 1000);
    }
  };

  const [deletingMessage, setDeletingMessage] = useState(false);
  const handleDeleteImage = async (fileName) => {
    try {
      setDeletingMessage(true);
      const deleteImage = await fetch(`${baseUrl}/api/Files/delete/${fileName}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (deleteImage.ok) {
        setImages((prevImages) => prevImages.filter(image => image.name !== fileName));
       
      } else {
        const deleteImageResponse = await deleteImage.json();
        console.error('Failed to delete file:', deleteImageResponse.message);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally { setDeletingMessage(false); }
  };

  const toggleCollapse = () => {
    setOpenCollapse(!openCollapse);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextImage,
    onSwipedRight: handlePreviousImage,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (isLoading) {
    return (
      <div className='min-h-[80vh] items-center justify-center flex' style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
        <PoleLoader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {(isBarber || isAdmin) && (
        <div className="flex items-center mt-2 w-full">
          <div className="p-4 rounded-2xl mb-2 relative transition-all duration-500 w-full bg-primary-dark" style={{ overflow: 'hidden' }}>
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold font-bodoni text-center text-white scale-y-125">UPLOAD IMAGE</h2>
              <button
                onClick={toggleCollapse}
                className="ml-auto text-white rounded-full text-2xl hover:scale-105 duration-300 mb-1"
              >
                {openCollapse ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <Collapse open={openCollapse}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 h-full">
                <div className="text-white mt-2 col-span-2">
                  <div className="w-full md:h-56 h-32 flex flex-col relative bg-secondary-dark rounded-2xl shadow-md">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onSelectFile}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-white justify-center items-center flex h-full flex-col pointer-events-none">
                      <SlCloudUpload className="text-6xl md:text-8xl" />
                      <p className="text-white text-sm md:text-base mt-2">{file ? file.name : 'Browse files to upload!'}</p>
                    </div>
                  </div>
                </div>

                <div className="text-white mt-2 flex justify-center items-center md:bg-transparent bg-secondary-dark bg-opacity-50 rounded-2xl">
                  <div className="flex flex-col items-center relative">
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-52 h-52 md:w-52 md:h-56 object-cover md:rounded-2xl shadow-md"
                        />
                        <button
                          className={`${getButtonStyle('standard', isTouchScreen)} text-3xl duration-300 !rounded-full z-10 absolute top-2 right-2`}
                          onClick={handleRemoveFile}
                        >
                          <RxCross2 className="text-3xl text-white p-1" />
                        </button>
                      </>
                    ) : (
                      <img
                        style={{ userSelect: 'none' }}
                        src="https://firebasestorage.googleapis.com/v0/b/barbershop-19606.appspot.com/o/Extras%2FImagePlaceholder.png?alt=media&token=d4edd68a-4246-4974-aa10-077f15340eda"
                        alt="Preview"
                        className="w-52 h-52 md:w-52 md:h-56 object-cover md:rounded-2xl shadow-md"
                      />
                    )}
                  </div>
                </div>
              </div>
            </Collapse>

            {openCollapse && (
              <div className="flex flex-col items-center justify-center w-full">
                {preview && (
                  <button
                    onClick={handleUpload}
                    className={`${getButtonStyle('standard', isTouchScreen)} mr-2 px-4 py-2 mt-5 ${uploadingImage ? 'pointer-events-none bg-darker-main' : ''}`}
                  >
                    {uploadingImage ? <BarLoader text='' heightClass='h-4' animationDuration='1.2s' /> : 'Upload'}
                  </button>
                )}
                <p
                  className="text-dark-main w-full text-center flex items-center justify-center mt-3"
                  style={{ userSelect: uploadMessage ? 'auto' : 'none' }}
                >
                  {uploadMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!fetchImageSuccess ? (
        <div className='flex flex-col items-center justify-center mt-5 h-[60vh]'>
          <HeadingTextAlt title={'SOMETHING WENT WRONG'} subtitle={'CLICK BELOW TO TRY AGAIN'}
            titleSize="md:text-2xl text-xl"
            subtitleSize="md:text-xl text-base" />
          <button
            onClick={() => fetchImages(true)}
            className={`${getButtonStyle('standard', isTouchScreen)} mr-2 px-4 py-2 mt-2`}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {images.length === 0 ? (
            <div className='flex items-center justify-center h-[80vh]'>
              <HeadingTextAlt title={'NO IMAGES HAVE BEEN UPLOADED'} subtitle={'CHECK BACK AGAIN LATER'}
                titleSize="md:text-2xl text-lg"
                subtitleSize="md:text-xl text-sm" />
            </div>
          ) : (
            <div>
              <div className="flex justify-between mt-2 mb-2">
                <button
                  className={`${getButtonStyle('standard', isTouchScreen)} ${currentPage === 1 ? 'opacity-25 pointer-events-none' : ''} text-3xl duration-300 !rounded-full`}
                  onClick={handlePreviousPage}
                  disabled={selectedImageIndex === 0}
                >
                  <MdOutlineNavigateNext className={`rotate-180 md:h-8 md:w-8 h-6 w-6 ${selectedImageIndex === 0 ? 'text-gray-500' : 'text-white'} items-center justify-center`} />
                </button>

                <button
                  className={`${getButtonStyle('standard', isTouchScreen)} ${currentPage === totalPages ? 'opacity-25 pointer-events-none' : ''} text-3xl duration-300 !rounded-full`}
                  onClick={currentPage === totalPages ? null : handleNextPage}
                  disabled={selectedImageIndex === 0}
                >
                  <MdOutlineNavigateNext className={`md:h-8 md:w-8 h-6 w-6 ${selectedImageIndex === 0 ? 'text-gray-500' : 'text-white'} items-center justify-center`} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentImages.map((image, index) => (
                  <div key={index} className="rounded overflow-hidden shadow-lg hover:shadow-md transition-shadow duration-300 relative">
                    {(isAdmin || isBarber) && (
                      <button
                        className={`${getButtonStyle('standard', isTouchScreen)} text-3xl duration-300 !rounded-full z-10 absolute top-2 right-2`}
                        onClick={deletingMessage ? null : () => handleDeleteImage(image.name)}
                      >
                        <RxCross2 className="text-3xl text-white p-1" />
                      </button>
                    )}
                    <img
                      src={image.url}
                      alt={image.name}
                      style={{ userSelect: 'none' }}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleImageClick(index)}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black bg-opacity-75" {...swipeHandlers}>
          <div className="fixed inset-0" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-4xl max-h-[80vh] flex justify-center items-center rounded-lg overflow-hidden">
            <button
              className={`${getButtonStyle('standard', isTouchScreen)} absolute left-3 p-2 ${selectedImageIndex === 0 ? 'opacity-50 pointer-events-none' : ''} duration-300`}
              onClick={handlePreviousImage}
              disabled={selectedImageIndex === 0}
            >
              <MdOutlineNavigateNext className={`rotate-180 md:h-8 md:w-8 h-6 w-6 ${selectedImageIndex === 0 ? 'text-gray-500' : 'text-white'}`} />
            </button>

            <img
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].name}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
              className="h-auto w-image rounded-xl"
            />

            <button
              className={`${getButtonStyle('standard', isTouchScreen)} absolute right-3 p-2 ${selectedImageIndex === images.length - 1 ? 'opacity-50 pointer-events-none' : ''} duration-300`}
              onClick={handleNextImage}
              disabled={selectedImageIndex === images.length - 1}
            >
              <MdOutlineNavigateNext className={`md:h-8 md:w-8 h-6 w-6 ${selectedImageIndex === images.length - 1 ? 'text-gray-500' : 'text-white'}`} />
            </button>
          </div>
        </div>
      )}

      {isCropping && (
        <div className="fixed inset-0 flex items-center justify-center z-50 container mx-auto p-4">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="relative p-4 rounded-2xl z-50 w-full max-w-lg bg-secondary-dark flex flex-col items-center">
            <ReactCrop
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={ASPECT_RATIO}
              minWidth={MIN_DIMENSION}
              keepSelection
            >
              <img
                className='rounded-2xl'
                ref={imgRef}
                src={preview}
                alt="Upload"
                style={{ maxHeight: '70vh' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
            <div className="flex mt-4">
              <button
                className={`${getButtonStyle('standard', isTouchScreen)} w-20 mr-2 px-4 py-2 mt-2`}
                onClick={handleSaveCrop}
              >
                Save
              </button>
              <button
                className={`${getButtonStyle('cancel', isTouchScreen)} w-20 px-4 py-2 mt-2`}
                onClick={handleRemoveFile}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
