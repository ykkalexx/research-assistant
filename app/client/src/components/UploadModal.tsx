import { Modal, Button, Text, Group } from "@mantine/core";
import { useState } from "react";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconX, IconFile } from "@tabler/icons-react";
import api from "../config/api";
import MyBtn from "./MyBtn";

interface UploadModalProps {
  onUploadSuccess: (docId: number) => void;
}

export const UploadModal = ({ onUploadSuccess }: UploadModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        onUploadSuccess(response.data.document.id);
        setOpen(false);
        setFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-light">
      <MyBtn onClick={() => setOpen(true)} color="blue">
        Upload PDF
      </MyBtn>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Upload a Document"
        size="lg"
      >
        <div className="space-y-4">
          <Dropzone
            onDrop={(files) => setFile(files[0])}
            maxSize={10 * 1024 * 1024}
            accept={["application/pdf"]}
            loading={loading}
          >
            <Group style={{ minHeight: 220, pointerEvents: "none" }}>
              <Dropzone.Accept>
                <IconUpload size={50} stroke={1.5} color="blue" />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} stroke={1.5} color="red" />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconFile size={50} stroke={1.5} />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  Drag & drop PDF here or click to select
                </Text>
                <Text size="sm" color="dimmed" inline mt={7}>
                  File should not exceed 10MB
                </Text>
              </div>
            </Group>
          </Dropzone>

          {file && (
            <div className="p-4 rounded-md bg-gray-50">
              <Text>Selected file: {file.name}</Text>
            </div>
          )}

          {error && (
            <div className="p-4 text-red-600 rounded-md bg-red-50">{error}</div>
          )}

          <Group mt="md">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              loading={loading}
              disabled={!file || loading}
            >
              Upload
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
};
