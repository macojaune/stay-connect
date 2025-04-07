defmodule StayConnectWeb.ReleaseDetailsLive do
  use StayConnectWeb, :live_view
  alias StayConnect.{Release, Vote}
  require Logger

  def mount(params, _session, socket) do
    release = Release.by_id!(params["release_id"])
    socket = socket |> assign(:release, release)
    {:ok, socket}
  end

  def get_featurings(release) do
    Enum.map(release.featurings, fn feat ->
      feat.name
    end)
    |> Enum.join(", ")
  end

  def get_platform(link) do
    cond do
      is_nil(link) -> link
      true -> Release.platform_from_url(link)
    end
  end

  def handle_event("upvote", _, socket) do
    user = socket.assigns.current_user
    release = socket.assigns.release

    cond do
      is_nil(user) ->
        {:noreply, put_flash(socket, :info, "Connecte-toi pour voter.")}

      true ->
        case Vote.upvote_release(user.id, release.id) do
          {:ok, _vote} ->
            updated_release = Release.by_id!(release.id)

            Logger.info(
              "Socket assigned with updated release: #{inspect(socket.assigns.release)}"
            )

            {:noreply, assign(socket, :release, updated_release)}

          {:error, changeset} ->
            Logger.error(
              "Error upvoting release #{release.id} by user #{user.id}: #{inspect(changeset)}"
            )

            {:noreply, put_flash(socket, :error, "Une erreur est survenue lors du vote.")}
        end
    end
  end
end
