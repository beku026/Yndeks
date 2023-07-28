import './App.css'
import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

interface IImgPreview {
  path: string;
  name: string
}

function App() {
  return (
    <>
    <YandexDiskUploader />
    </>
  )
}

export default App


export const YandexDiskUploader: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileLinks, setFileLinks] = useState<IImgPreview[]>([]);
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleUpload = async (files: File[]) => {
    try {
      const yandexDiskAPI = 'https://cloud-api.yandex.net/v1/disk/resources/upload';
      const accessToken = 'y0_AgAAAABqCutyAApA8gAAAADo25uoHpJV0fETQQS3P37T7Bvfk7B-u1s';
      setIsLoading(true)
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        

        const response = await axios.get(yandexDiskAPI, {
          headers: {
            Authorization: `OAuth ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            path: '/front/' + file.name,
            overwrite: false,
          }
        });


        const { href} = response.data;
        await axios.put(href, formData, {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });
        
        
        const publick = await axios.put(
          `https://cloud-api.yandex.net/v1/disk/resources/publish`,
          null,
          {
            headers: {
              Authorization: `OAuth ${accessToken}`,
            },
            params: {
              path: response.config.params.path,
            },
          }
        );


        const preview = await axios.get(publick.data.href, {headers: {
          Authorization: `OAuth ${accessToken}`,
          'Content-Type': 'application/json',
        }})
        setFileLinks(prev => [...prev, {
          path:preview.data.public_url, 
          name: preview.data.name
        }])
        setUploadedFiles((prevFiles) => [...prevFiles, file]);
      }
    } catch (error: any) {
      setError(error.response.data.message)
    } finally {
      setIsLoading(false)
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    maxFiles: 100,
    onDrop: handleUpload,
  });
  console.log(uploadedFiles)
  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #aaa', padding: '20px', textAlign: 'center' }}>
        <input {...getInputProps()} />
        <p>Переташите файлы для загрузки</p>
      </div>
      {isLoading ? (<p className='loading'>...Загрузка</p>) : null}
      {!!error.length && (<p className='error'>Ошибка: {error}</p> )}
      {uploadedFiles.length > 0 && (
        <div className='upload'>
          <h2>Uploaded Files:</h2>
          <ul className='list'>
            {fileLinks.map((file, index) => (
              <li key={index}>
                <a href={file.path} target='_blank'>{file.name}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};